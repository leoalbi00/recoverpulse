import { NextResponse } from "next/server";
import { z } from "zod";

import { getStripeClientForAccount } from "@/lib/stripe";
import { getStripeAccountIdForUser } from "@/lib/connected-stripe-accounts";
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
    userId: updated.userId,
    to: updated.customerEmail,
    customerName: updated.customerName,
    planName: updated.planName,
    amountFormatted: formatAmount(updated.amount, updated.currency),
  });
}

export async function POST(request: Request, context: RouteContext<"/api/update-payment/[token]/confirm">) {
  const { token } = await context.params;

  let paymentToken: Awaited<ReturnType<typeof validatePaymentToken>>;
  let transaction: FailedTransaction | null;
  try {
    paymentToken = await validatePaymentToken(token);
    transaction = paymentToken
      ? await getTransactionByCustomerId(paymentToken.customerId, paymentToken.userId ?? undefined)
      : null;
  } catch (error) {
    console.error(`[update-payment-confirm] errore nella verifica del token "${token}" su Supabase:`, error);
    return NextResponse.json(
      { error: "Servizio temporaneamente non disponibile. Riprova tra qualche minuto." },
      { status: 503 }
    );
  }

  if (!paymentToken) {
    return NextResponse.json({ error: "Link non valido o scaduto." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati mancanti." }, { status: 400 });
  }

  if (!transaction) {
    // Token valido ma nessuna fattura fallita associata: caso "aggiornamento
    // preventivo" (customer.source.expiring). Nessuna modalità simulata qui
    // (v1 solo Stripe reale, vedi src/app/pay/[token]/page.tsx).
    if (!("setupIntentId" in parsed.data)) {
      return NextResponse.json({ error: "Dati mancanti." }, { status: 400 });
    }
    if (!paymentToken.userId) {
      return NextResponse.json({ error: "Token non associato a un merchant." }, { status: 409 });
    }

    const stripeAccountId = await getStripeAccountIdForUser(paymentToken.userId);
    if (!stripeAccountId) {
      return NextResponse.json({ error: "Nessun account Stripe collegato per questo merchant." }, { status: 409 });
    }

    const stripe = await getStripeClientForAccount(stripeAccountId);
    const setupIntent = await stripe.setupIntents.retrieve(parsed.data.setupIntentId);
    const setupCustomerId =
      typeof setupIntent.customer === "string" ? setupIntent.customer : setupIntent.customer?.id;

    if (setupIntent.status !== "succeeded" || setupCustomerId !== paymentToken.customerId) {
      return NextResponse.json({ error: "Verifica della carta non riuscita." }, { status: 400 });
    }

    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;
    if (!paymentMethodId) {
      return NextResponse.json({ error: "Nessun metodo di pagamento associato al SetupIntent." }, { status: 400 });
    }

    await stripe.customers.update(paymentToken.customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Nessun transaction.subscriptionId disponibile qui: aggiorna il metodo
    // di pagamento predefinito su tutte le sottoscrizioni attive del
    // customer (in pratica quasi sempre una sola, per questo caso d'uso una
    // singola pagina di risultati è sufficiente).
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: paymentToken.customerId,
      status: "active",
    });
    for (const subscription of activeSubscriptions.data) {
      await stripe.subscriptions.update(subscription.id, { default_payment_method: paymentMethodId });
    }

    // Non tocca failed_transactions/notifiche/dunning: non esiste una
    // fattura fallita da recuperare in questo ramo.
    await markPaymentTokenUsed(token);

    return NextResponse.json({ success: true, planName: "il tuo abbonamento" });
  }

  if (transaction.status === "recuperato") {
    return NextResponse.json({ success: true, planName: transaction.planName });
  }

  if ("simulate" in parsed.data) {
    // Consentita solo se un vero SetupIntent Stripe non è comunque ottenibile
    // per questa transazione (stessa verifica che la pagina /pay/[token] fa
    // per decidere se mostrare il form reale o quello simulato): impedisce di
    // usare la conferma simulata per saltare la verifica reale della carta su
    // una transazione per cui Stripe funziona correttamente.
    const realClientSecret = await tryCreateSetupIntent({ userId: transaction.userId, customerId: transaction.customerId });
    if (realClientSecret) {
      return NextResponse.json(
        { error: "Stripe è disponibile per questa transazione: usa il modulo di pagamento reale." },
        { status: 409 }
      );
    }

    await markPaymentTokenUsed(token);

    const updated = await markInvoiceRecovered(transaction.invoiceId, transaction.userId);
    if (updated) {
      await stopDunningSequence(updated);
      await notifyRecovery(updated);
    }

    return NextResponse.json({ success: true, planName: transaction.planName, simulated: true });
  }

  const stripeAccountId = await getStripeAccountIdForUser(transaction.userId);
  if (!stripeAccountId) {
    return NextResponse.json(
      { error: "Nessun account Stripe collegato per questo merchant. Usa la conferma simulata." },
      { status: 409 }
    );
  }
  const stripe = await getStripeClientForAccount(stripeAccountId);
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

  const updated = await markInvoiceRecovered(transaction.invoiceId, transaction.userId);
  if (updated) {
    await stopDunningSequence(updated);
    await notifyRecovery(updated);
  }

  return NextResponse.json({ success: true, planName: transaction.planName });
}
