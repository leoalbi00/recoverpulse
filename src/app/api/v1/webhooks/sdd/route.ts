import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";

import { getUserIdForApiKey } from "@/lib/merchant-api-keys";
import { recordFailedPayment } from "@/lib/transactions";
import { createPaymentToken } from "@/lib/tokens";
import { startDunningSequence } from "@/lib/dunning";
import { notifyPaymentFailed } from "@/lib/notifications";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Payload documentato in /dashboard/impostazioni (sezione Integrazione
// SDD/SEPA): un gestionale/CRM esterno che gestisce da sé gli addebiti SEPA
// Direct Debit notifica qui un insoluto, senza passare da Stripe.
const sddWebhookSchema = z.object({
  customer_email: z.string().trim().email("customer_email non valido."),
  customer_name: z.string().trim().max(160).optional(),
  amount: z.number().int("amount deve essere un intero in centesimi.").positive("amount deve essere positivo."),
  currency: z.string().trim().length(3, "currency deve essere un codice ISO a 3 lettere.").toLowerCase(),
  mandate_ref: z.string().trim().min(1, "mandate_ref è obbligatorio.").max(120),
  failure_reason: z.string().trim().min(1, "failure_reason è obbligatorio.").max(500),
  // Codice di storno SEPA (AC01 - IBAN errato, MD01 - mandato mancante, MS02 -
  // rifiutato dal debitore, ...): opzionale, non tutti i gestionali lo espongono.
  failure_code: z.string().trim().max(10).optional(),
  iban_last4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "iban_last4 deve contenere esattamente 4 cifre.")
    .optional(),
  plan_name: z.string().trim().max(160).optional(),
});

function extractApiKey(request: Request): string | null {
  const headerKey = request.headers.get("x-api-key");
  if (headerKey) return headerKey.trim();

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice("Bearer ".length).trim();

  return null;
}

/**
 * Webhook universale per gli insoluti SDD (SEPA Direct Debit) segnalati da
 * gestionali/CRM esterni che gestiscono da sé gli addebiti bancari (fuori da
 * Stripe). Autenticato con la `merchant_api_key` generabile in
 * /dashboard/impostazioni: non essendoci un segreto webhook condiviso in
 * anticipo come per Stripe (firma HMAC), la API Key nell'header gioca lo
 * stesso ruolo di autenticazione, sempre su connessione HTTPS.
 *
 * Al ricevimento registra l'insoluto su `failed_transactions`
 * (payment_method_type 'sepa_debit') e avvia subito la stessa sequenza di
 * dunning automatica già in produzione per gli insoluti carta
 * (src/lib/dunning.ts), con il template email dedicato SDD.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`sdd-webhook:${ip}`, 60, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Troppe richieste. Riprova più tardi." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json(
      { error: "API Key mancante. Passala nell'header X-Api-Key o Authorization: Bearer <chiave>." },
      { status: 401 }
    );
  }

  let userId: string | null;
  try {
    userId = await getUserIdForApiKey(apiKey);
  } catch (error) {
    console.error("[webhooks/sdd] errore nella verifica della API Key:", error);
    return NextResponse.json({ error: "Errore interno durante l'autenticazione." }, { status: 500 });
  }

  if (!userId) {
    return NextResponse.json({ error: "API Key non valida." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = sddWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Payload non valido." }, { status: 400 });
  }

  const data = parsed.data;
  // Nessun invoice_id reale (non è un evento Stripe): un identificatore
  // sintetico ma univoco per ogni chiamata, per non far collidere due
  // insoluti diversi sullo stesso mandato sull'unique constraint di
  // failed_transactions.invoice_id.
  const invoiceId = `sdd_${data.mandate_ref.replace(/[^a-zA-Z0-9_-]/g, "")}_${crypto.randomBytes(4).toString("hex")}`;
  const customerId = `sdd:${data.mandate_ref}`;
  const customerName = data.customer_name?.trim() || data.customer_email.split("@")[0];
  const planName = data.plan_name?.trim() || "Addebito SEPA";

  try {
    const paymentLinkToken = await createPaymentToken({ customerId, userId });

    const transaction = await recordFailedPayment({
      userId,
      invoiceId,
      customerId,
      customerName,
      customerEmail: data.customer_email,
      subscriptionId: null,
      planName,
      amount: data.amount,
      currency: data.currency,
      reason: data.failure_reason,
      paymentLinkToken,
      hostedInvoiceUrl: null,
      paymentMethodType: "sepa_debit",
      ibanLast4: data.iban_last4 ?? null,
      mandateReference: data.mandate_ref,
      failureCode: data.failure_code ?? null,
    });

    console.log(
      `[webhooks/sdd] insoluto SDD registrato per l'utente ${userId}: invoiceId=${invoiceId} mandate=${data.mandate_ref} amount=${data.amount} ${data.currency.toUpperCase()}`
    );

    await notifyPaymentFailed(transaction);
    await startDunningSequence(transaction);

    return NextResponse.json({ success: true, invoiceId });
  } catch (error) {
    console.error("[webhooks/sdd] errore nella gestione dell'insoluto SDD:", error);
    return NextResponse.json({ error: "Errore interno durante la registrazione dell'insoluto." }, { status: 500 });
  }
}
