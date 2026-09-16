import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { getConnectedGoCardlessAccountForUser, getUserIdForOrganisation } from "@/lib/connected-gocardless-accounts";
import { getCustomer, getMandate, getPayment } from "@/lib/gocardless";
import { recordFailedPayment } from "@/lib/transactions";
import { createPaymentToken } from "@/lib/tokens";
import { startDunningSequence } from "@/lib/dunning";
import { notifyPaymentFailed } from "@/lib/notifications";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const HANDLED_ACTIONS = new Set(["failed", "charged_back"]);

type GoCardlessEvent = {
  id: string;
  resource_type: string;
  action: string;
  links?: { organisation?: string; payment?: string };
  details?: { cause?: string; description?: string };
};

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.GOCARDLESS_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  return provided.length === expectedBuf.length && crypto.timingSafeEqual(provided, expectedBuf);
}

/**
 * Webhook universale GoCardless: UN SOLO endpoint, registrato una volta nel
 * Dashboard Partner GoCardless (non per merchant, vedi
 * src/app/api/gocardless/connect/callback/route.ts), riceve gli eventi di
 * TUTTE le organisation collegate via OAuth, distinte dal campo
 * `links.organisation` di ogni evento. Equivalente GoCardless dei webhook
 * universali PayPal/SDD già in produzione
 * (src/app/api/v1/webhooks/{paypal/[apiKey],sdd}/route.ts).
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`gocardless-webhook:${ip}`, 120, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Troppe richieste. Riprova più tardi." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("webhook-signature");
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Firma webhook non valida." }, { status: 401 });
  }

  let payload: { events?: GoCardlessEvent[] } | null;
  try {
    payload = JSON.parse(rawBody) as { events?: GoCardlessEvent[] };
  } catch {
    return NextResponse.json({ error: "Payload non valido." }, { status: 400 });
  }

  const events = payload?.events ?? [];

  for (const event of events) {
    if (event.resource_type !== "payments" || !HANDLED_ACTIONS.has(event.action)) continue;

    const organisationId = event.links?.organisation;
    const paymentId = event.links?.payment;
    if (!organisationId || !paymentId) continue;

    try {
      const userId = await getUserIdForOrganisation(organisationId);
      if (!userId) continue;

      const account = await getConnectedGoCardlessAccountForUser(userId);
      if (!account) continue;

      const payment = await getPayment(account.accessToken, paymentId, account.environment);
      const mandate = payment.links?.mandate
        ? await getMandate(account.accessToken, payment.links.mandate, account.environment)
        : null;
      const customer = mandate?.links?.customer
        ? await getCustomer(account.accessToken, mandate.links.customer, account.environment)
        : null;

      const customerEmail = customer?.email;
      if (!customerEmail) continue;

      const customerName =
        [customer?.given_name, customer?.family_name].filter(Boolean).join(" ") || customerEmail.split("@")[0];

      const invoiceId = `gocardless_${paymentId}`;
      const customerId = `gocardless:${customer?.id ?? paymentId}`;

      const paymentLinkToken = await createPaymentToken({ customerId, userId });

      const transaction = await recordFailedPayment({
        userId,
        invoiceId,
        customerId,
        customerName,
        customerEmail,
        subscriptionId: null,
        planName: "Addebito SEPA (GoCardless)",
        amount: payment.amount,
        currency: payment.currency.toLowerCase(),
        reason: event.details?.description ?? "Addebito SEPA Direct Debit non riuscito.",
        paymentLinkToken,
        hostedInvoiceUrl: null,
        paymentMethodType: "sepa_debit",
        mandateReference: mandate?.reference ?? null,
        failureCode: event.details?.cause ?? null,
      });

      console.log(
        `[webhooks/gocardless] insoluto GoCardless registrato per l'utente ${userId}: invoiceId=${invoiceId} payment=${paymentId} amount=${payment.amount} ${payment.currency}`
      );

      await notifyPaymentFailed(transaction);
      await startDunningSequence(transaction);
    } catch (error) {
      console.error(`[webhooks/gocardless] errore nella gestione dell'evento ${event.id}:`, error);
    }
  }

  return NextResponse.json({ success: true });
}
