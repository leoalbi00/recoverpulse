import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { getUserIdForApiKey } from "@/lib/merchant-api-keys";
import { getPaypalSettings, isPaypalConfigured } from "@/lib/paypal-settings";
import { verifyPaypalWebhookSignature, type PaypalWebhookHeaders } from "@/lib/paypal";
import { recordFailedPayment } from "@/lib/transactions";
import { createPaymentToken } from "@/lib/tokens";
import { startDunningSequence } from "@/lib/dunning";
import { notifyPaymentFailed } from "@/lib/notifications";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const HANDLED_EVENT_TYPES = new Set(["BILLING.SUBSCRIPTION.PAYMENT.FAILED", "BILLING.SUBSCRIPTION.SUSPENDED"]);

type PaypalSubscriptionResource = {
  id?: string;
  plan_id?: string;
  subscriber?: {
    email_address?: string;
    payer_id?: string;
    name?: { given_name?: string; surname?: string };
  };
  billing_info?: {
    outstanding_balance?: { value?: string; currency_code?: string };
    last_payment?: { amount?: { value?: string; currency_code?: string } };
  };
};

type PaypalWebhookEvent = {
  event_type?: string;
  summary?: string;
  resource?: PaypalSubscriptionResource;
};

/** Converte un importo PayPal in unità maggiori (es. "49.00") in centesimi interi. */
function toCents(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function extractHeaders(request: Request): PaypalWebhookHeaders | null {
  const transmissionId = request.headers.get("paypal-transmission-id");
  const transmissionTime = request.headers.get("paypal-transmission-time");
  const certUrl = request.headers.get("paypal-cert-url");
  const authAlgo = request.headers.get("paypal-auth-algo");
  const transmissionSig = request.headers.get("paypal-transmission-sig");

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) return null;
  return { transmissionId, transmissionTime, certUrl, authAlgo, transmissionSig };
}

/**
 * Webhook universale per le PayPal Subscriptions, equivalente PayPal del
 * webhook SDD/SEPA (src/app/api/v1/webhooks/sdd/route.ts): un merchant
 * registra questo URL nel proprio PayPal Developer Dashboard per gli eventi
 * BILLING.SUBSCRIPTION.PAYMENT.FAILED e BILLING.SUBSCRIPTION.SUSPENDED.
 *
 * A differenza del webhook SDD, PayPal non permette di allegare header
 * custom (es. X-Api-Key) alle proprie chiamate: l'identificazione del
 * merchant passa quindi dalla stessa `merchant_api_key` incorporata nel
 * segmento dinamico dell'URL (`/webhooks/paypal/[apiKey]`), non da un header.
 * L'autenticità dell'evento è comunque verificata (in aggiunta, non in
 * sostituzione) tramite l'API ufficiale di verifica firma PayPal, con le
 * credenziali Client ID/Secret/Webhook ID salvate dal merchant in dashboard.
 */
export async function POST(request: Request, context: RouteContext<"/api/v1/webhooks/paypal/[apiKey]">) {
  const { apiKey } = await context.params;

  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`paypal-webhook:${ip}`, 60, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Troppe richieste. Riprova più tardi." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  let userId: string | null;
  try {
    userId = await getUserIdForApiKey(apiKey);
  } catch (error) {
    console.error("[webhooks/paypal] errore nella verifica della API Key:", error);
    return NextResponse.json({ error: "Errore interno durante l'autenticazione." }, { status: 500 });
  }

  if (!userId) {
    return NextResponse.json({ error: "URL webhook non valido." }, { status: 401 });
  }

  const event = (await request.json().catch(() => null)) as PaypalWebhookEvent | null;
  if (!event) {
    return NextResponse.json({ error: "Payload non valido." }, { status: 400 });
  }

  const settings = await getPaypalSettings(userId);
  if (!isPaypalConfigured(settings)) {
    return NextResponse.json(
      { error: "Nessun account PayPal collegato per questo merchant." },
      { status: 409 }
    );
  }

  const signatureHeaders = extractHeaders(request);
  if (!signatureHeaders || !settings.webhookId) {
    return NextResponse.json(
      { error: "Header di firma PayPal mancanti o Webhook ID non configurato." },
      { status: 401 }
    );
  }

  try {
    const verified = await verifyPaypalWebhookSignature(
      { clientId: settings.clientId, clientSecret: settings.clientSecret },
      settings.webhookId,
      signatureHeaders,
      event
    );
    if (!verified) {
      return NextResponse.json({ error: "Firma dell'evento PayPal non valida." }, { status: 401 });
    }
  } catch (error) {
    console.error("[webhooks/paypal] errore nella verifica della firma:", error);
    return NextResponse.json({ error: "Errore interno durante la verifica della firma." }, { status: 500 });
  }

  if (!event.event_type || !HANDLED_EVENT_TYPES.has(event.event_type)) {
    // Evento verificato ma non tra quelli gestiti (es. BILLING.SUBSCRIPTION.ACTIVATED):
    // 200 così PayPal non lo ritenta all'infinito.
    return NextResponse.json({ received: true });
  }

  const resource = event.resource ?? {};
  const subscriptionId = resource.id;
  if (!subscriptionId) {
    return NextResponse.json({ error: "resource.id (subscription) mancante nell'evento." }, { status: 400 });
  }

  const customerEmail = resource.subscriber?.email_address;
  if (!customerEmail) {
    return NextResponse.json({ error: "subscriber.email_address mancante nell'evento." }, { status: 400 });
  }

  const customerName =
    [resource.subscriber?.name?.given_name, resource.subscriber?.name?.surname].filter(Boolean).join(" ") ||
    customerEmail.split("@")[0];

  const amountInfo = resource.billing_info?.outstanding_balance ?? resource.billing_info?.last_payment?.amount;
  const amount = toCents(amountInfo?.value);
  const currency = (amountInfo?.currency_code ?? "EUR").toLowerCase();

  const reason =
    event.summary ??
    (event.event_type === "BILLING.SUBSCRIPTION.SUSPENDED"
      ? "Abbonamento sospeso da PayPal per pagamento non riuscito."
      : "Pagamento dell'abbonamento non riuscito su PayPal.");

  const invoiceId = `paypal_${subscriptionId}_${crypto.randomBytes(4).toString("hex")}`;
  const customerId = `paypal:${subscriptionId}`;

  try {
    const paymentLinkToken = await createPaymentToken({ customerId, userId });

    const transaction = await recordFailedPayment({
      userId,
      invoiceId,
      customerId,
      customerName,
      customerEmail,
      subscriptionId: null,
      planName: "Abbonamento PayPal",
      amount,
      currency,
      reason,
      paymentLinkToken,
      hostedInvoiceUrl: null,
      paymentMethodType: "paypal",
      paypalSubscriptionId: subscriptionId,
      gatewayCustomerId: resource.subscriber?.payer_id ?? null,
    });

    console.log(
      `[webhooks/paypal] insoluto PayPal registrato per l'utente ${userId}: invoiceId=${invoiceId} subscription=${subscriptionId} amount=${amount} ${currency.toUpperCase()}`
    );

    await notifyPaymentFailed(transaction);
    await startDunningSequence(transaction);

    return NextResponse.json({ success: true, invoiceId });
  } catch (error) {
    console.error("[webhooks/paypal] errore nella gestione dell'insoluto PayPal:", error);
    return NextResponse.json({ error: "Errore interno durante la registrazione dell'insoluto." }, { status: 500 });
  }
}
