import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripeClient } from "@/lib/stripe";
import { markInvoiceRecovered, recordFailedPayment } from "@/lib/transactions";
import { startDunningSequence, stopDunningSequence } from "@/lib/dunning";
import { setStripeCustomerForUser } from "@/lib/billing";
import { createPaymentToken } from "@/lib/tokens";
import { notifyPaymentRecovered } from "@/lib/notifications";

// Usata quando l'evento Stripe non porta un'email cliente risolvibile (tipico dei
// test lanciati con `stripe trigger`): invece di saltare l'invio, la sequenza di
// dunning parte comunque verso questo indirizzo di test.
const FALLBACK_TEST_EMAIL = process.env.STRIPE_WEBHOOK_FALLBACK_EMAIL ?? "leo.elox.24@gmail.com";

async function resolveCustomer(
  stripe: Stripe,
  customerId: string | Stripe.Customer | Stripe.DeletedCustomer | null
) {
  if (!customerId) {
    return { id: "", name: "Gentile cliente", email: "" };
  }

  if (typeof customerId !== "string") {
    return {
      id: customerId.id,
      name: "deleted" in customerId ? "Cliente eliminato" : (customerId.name ?? "Gentile cliente"),
      email: "deleted" in customerId ? "" : (customerId.email ?? ""),
    };
  }

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    console.log(`[stripe-webhook] cliente ${customerId} risulta eliminato su Stripe: email non disponibile.`);
    return { id: customer.id, name: "Cliente eliminato", email: "" };
  }

  console.log(
    `[stripe-webhook] cliente ${customer.id} risolto da Stripe: email="${customer.email ?? ""}" name="${customer.name ?? ""}"`
  );

  return { id: customer.id, name: customer.name ?? "Gentile cliente", email: customer.email ?? "" };
}

function resolveSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

async function handleInvoicePaymentFailed(stripe: Stripe, invoice: Stripe.Invoice) {
  console.log(
    `[stripe-webhook] invoice.payment_failed: invoice.customer_email (raw dall'evento) = "${invoice.customer_email ?? ""}"`
  );

  const customer = await resolveCustomer(stripe, invoice.customer);

  if (!customer.email) {
    console.warn(
      `[stripe-webhook] ATTENZIONE: nessuna email risolta per il cliente ${customer.id || "sconosciuto"} (probabile evento di test da Stripe CLI). Uso l'email di fallback "${FALLBACK_TEST_EMAIL}" invece di saltare l'invio.`
    );
    customer.email = FALLBACK_TEST_EMAIL;
  }

  const reason =
    invoice.last_finalization_error?.message ??
    "Pagamento rifiutato dall'istituto emittente della carta.";
  const planName = invoice.lines.data[0]?.description ?? "Abbonamento";
  const invoiceId = invoice.id ?? crypto.randomUUID();

  // Token monouso valido 7 giorni per il portale 1-click di aggiornamento carta:
  // generato e salvato (hashato) su Supabase ad ogni fallimento di pagamento, così
  // il link inviato nella sequenza di dunning è sempre nuovo e verificabile lato server.
  const paymentLinkToken = await createPaymentToken({ customerId: customer.id });

  const transaction = await recordFailedPayment({
    invoiceId,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    subscriptionId: resolveSubscriptionId(invoice),
    planName,
    amount: invoice.amount_due,
    currency: invoice.currency,
    reason,
    paymentLinkToken,
  });

  console.log(
    `[stripe-webhook] invoice.payment_failed ricevuto per fattura ${invoiceId} (cliente ${customer.id}): token di recupero generato su Supabase, valido 7 giorni.`
  );
  console.log(
    `[stripe-webhook] avvio dunning per fattura ${invoiceId}: customerEmail="${transaction.customerEmail}" paymentLinkToken=${paymentLinkToken ? "presente" : "assente"}`
  );

  await startDunningSequence(transaction);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.id) return;

  const transaction = await markInvoiceRecovered(invoice.id);
  if (transaction) {
    await stopDunningSequence(transaction);
    await notifyPaymentRecovered(transaction);
  }
}

function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const customerId = session.customer;
  if (userId && typeof customerId === "string") {
    setStripeCustomerForUser(userId, customerId);
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET environment variable");
    return NextResponse.json({ error: "Webhook Stripe non configurato." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Header stripe-signature mancante." }, { status: 400 });
  }

  const stripe = await getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Firma webhook non valida." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(stripe, event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case "checkout.session.completed":
        handleCheckoutSessionCompleted(event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`Errore durante la gestione dell'evento Stripe ${event.type}:`, error);
    return NextResponse.json({ error: "Errore interno durante la gestione dell'evento." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
