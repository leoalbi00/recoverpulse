import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { markInvoiceRecovered, recordFailedPayment } from "@/lib/transactions";
import { startDunningSequence, stopDunningSequence } from "@/lib/dunning";
import { setStripeCustomerForUser } from "@/lib/billing";
import { createPaymentToken } from "@/lib/tokens";

async function resolveCustomer(customerId: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!customerId) {
    return { id: "", name: "Cliente sconosciuto", email: "" };
  }

  if (typeof customerId !== "string") {
    return {
      id: customerId.id,
      name: "deleted" in customerId ? "Cliente eliminato" : (customerId.name ?? "Cliente sconosciuto"),
      email: "deleted" in customerId ? "" : (customerId.email ?? ""),
    };
  }

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    return { id: customer.id, name: "Cliente eliminato", email: "" };
  }

  return { id: customer.id, name: customer.name ?? "Cliente sconosciuto", email: customer.email ?? "" };
}

function resolveSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customer = await resolveCustomer(invoice.customer);
  const reason =
    invoice.last_finalization_error?.message ??
    "Pagamento rifiutato dall'istituto emittente della carta.";
  const planName = invoice.lines.data[0]?.description ?? "Abbonamento";
  const invoiceId = invoice.id ?? crypto.randomUUID();

  // Token monouso valido 7 giorni per il portale 1-click di aggiornamento carta:
  // generato e salvato (hashato) su Supabase ad ogni fallimento di pagamento, così
  // il link inviato nella sequenza di dunning è sempre nuovo e verificabile lato server.
  const paymentLinkToken = await createPaymentToken({ customerId: customer.id });

  const transaction = recordFailedPayment({
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

  await startDunningSequence(transaction);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.id) return;

  const transaction = markInvoiceRecovered(invoice.id);
  if (transaction) {
    await stopDunningSequence(transaction);
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
        await handleInvoicePaymentFailed(event.data.object);
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
