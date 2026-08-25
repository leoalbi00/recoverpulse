import { NextResponse } from "next/server";
import { z } from "zod";

import { stripe } from "@/lib/stripe";
import { validatePaymentToken, markPaymentTokenUsed } from "@/lib/tokens";
import { getTransactionByCustomerId, markInvoiceRecovered } from "@/lib/transactions";
import { stopDunningSequence } from "@/lib/dunning";

const confirmSchema = z.object({
  setupIntentId: z.string().min(1),
});

export async function POST(request: Request, context: RouteContext<"/api/update-payment/[token]/confirm">) {
  const { token } = await context.params;

  let transaction;
  try {
    const paymentToken = await validatePaymentToken(token);
    transaction = paymentToken ? await getTransactionByCustomerId(paymentToken.customerId) : null;
  } catch (error) {
    console.error(`[update-payment-confirm] errore nella verifica del token "${token}" su Supabase:`, error);
    return NextResponse.json(
      { error: "Servizio temporaneamente non disponibile. Riprova tra qualche minuto." },
      { status: 503 }
    );
  }

  if (!transaction) {
    return NextResponse.json({ error: "Link non valido o scaduto." }, { status: 404 });
  }

  if (transaction.status === "recuperato") {
    return NextResponse.json({ success: true, planName: transaction.planName });
  }

  const body = await request.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "setupIntentId mancante." }, { status: 400 });
  }

  const setupIntent = await stripe.setupIntents.retrieve(parsed.data.setupIntentId);

  const setupCustomerId =
    typeof setupIntent.customer === "string" ? setupIntent.customer : setupIntent.customer?.id;

  if (setupIntent.status !== "succeeded" || setupCustomerId !== transaction.customerId) {
    return NextResponse.json({ error: "Verifica della carta non riuscita." }, { status: 400 });
  }

  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;

  if (!paymentMethodId) {
    return NextResponse.json({ error: "Nessun metodo di pagamento associato al SetupIntent." }, { status: 400 });
  }

  await stripe.customers.update(transaction.customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  if (transaction.subscriptionId) {
    await stripe.subscriptions.update(transaction.subscriptionId, {
      default_payment_method: paymentMethodId,
    });
  }

  try {
    await stripe.invoices.pay(transaction.invoiceId, { payment_method: paymentMethodId });
  } catch (error) {
    console.error(`Riaddebito fattura ${transaction.invoiceId} non riuscito dopo aggiornamento carta:`, error);
    return NextResponse.json(
      { error: "La carta è stata salvata ma il pagamento è stato rifiutato di nuovo. Prova con un altro metodo." },
      { status: 402 }
    );
  }

  // Invalida il token subito dopo il successo: impedisce che lo stesso link
  // monouso venga riutilizzato per un secondo aggiornamento carta.
  await markPaymentTokenUsed(token);

  const updated = await markInvoiceRecovered(transaction.invoiceId);
  if (updated) {
    await stopDunningSequence(updated);
  }

  return NextResponse.json({ success: true, planName: transaction.planName });
}
