import { NextResponse } from "next/server";
import { z } from "zod";

import { getStripeClient } from "@/lib/stripe";
import { validatePaymentToken, markPaymentTokenUsed } from "@/lib/tokens";
import { getTransactionByCustomerId, markInvoiceRecovered, type FailedTransaction } from "@/lib/transactions";
import { stopDunningSequence } from "@/lib/dunning";
import { notifyPaymentRecovered } from "@/lib/notifications";
import { tryCreateSetupIntent } from "@/lib/payment-portal";
import { sendRecoveryConfirmationEmail } from "@/lib/email";

const confirmSchema = z.union([
  z.object({ setupIntentId: z.string().min(1) }),
  z.object({ simulate: z.literal(true) }),
]);

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: currency.toUpperCase() }).format(
    amount / 100
  );
}

/**
 * Notifica interna in dashboard + email di conferma al cliente, condivise
 * dai due percorsi di conferma (Stripe reale e simulazione).
 */
async function notifyRecovery(updated: FailedTransaction): Promise<void> {
  await notifyPaymentRecovered(updated);
  await sendRecoveryConfirmationEmail({
    to: updated.customerEmail,
    customerName: updated.customerName,
    planName: updated.planName,
    amountFormatted: formatAmount(updated.amount, updated.currency),
  });
}

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
    return NextResponse.json({ error: "Dati mancanti." }, { status: 400 });
  }

  if ("simulate" in parsed.data) {
    // Consentita solo se un vero SetupIntent Stripe non è comunque ottenibile
    // per questa transazione (stessa verifica che la pagina /pay/[token] fa
    // per decidere se mostrare il form reale o quello simulato): impedisce di
    // usare la conferma simulata per saltare la verifica reale della carta su
    // una transazione per cui Stripe funziona correttamente.
    const realClientSecret = await tryCreateSetupIntent(transaction);
    if (realClientSecret) {
      return NextResponse.json(
        { error: "Stripe è disponibile per questa transazione: usa il modulo di pagamento reale." },
        { status: 409 }
      );
    }

    await markPaymentTokenUsed(token);

    const updated = await markInvoiceRecovered(transaction.invoiceId);
    if (updated) {
      await stopDunningSequence(updated);
      await notifyRecovery(updated);
    }

    return NextResponse.json({ success: true, planName: transaction.planName, simulated: true });
  }

  const stripe = await getStripeClient();
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
    await notifyRecovery(updated);
  }

  return NextResponse.json({ success: true, planName: transaction.planName });
}
