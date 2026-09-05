import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getPlatformStripeClient, getStripeClientForAccount } from "@/lib/stripe";
import { getUserIdForStripeAccount } from "@/lib/connected-stripe-accounts";
import {
  getTransactionByCustomerId,
  markInvoiceRecovered,
  markSubscriptionLost,
  recordFailedPayment,
} from "@/lib/transactions";
import { startDunningSequence, stopDunningSequence } from "@/lib/dunning";
import { setStripeCustomerForUser, setSubscriptionForUser, getUserIdForStripeCustomer } from "@/lib/billing";
import { findUserByEmail } from "@/lib/users";
import { createPaymentToken } from "@/lib/tokens";
import { notifyPaymentFailed, notifyPaymentRecovered } from "@/lib/notifications";
import { sendCardExpiringEmail } from "@/lib/email";
import { getAppBaseUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";

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

async function handleInvoicePaymentFailed(
  stripe: Stripe,
  invoice: Stripe.Invoice,
  userId: string,
  connectedAccountId: string
) {
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

  // Log dettagliato di conferma ricezione evento, visibile sia nei log di
  // Vercel (Functions > Logs) sia in locale con `stripe listen` + `next dev`:
  // riporta tutti i dati chiave estratti dal payload prima di procedere con
  // la registrazione su Supabase e l'avvio del dunning.
  console.log(
    `[stripe-webhook] === invoice.payment_failed ricevuto === accountId=${connectedAccountId} invoiceId=${invoiceId} customerEmail="${customer.email}" amount=${invoice.amount_due} ${invoice.currency.toUpperCase()}`
  );

  // Token monouso valido 7 giorni per il portale 1-click di aggiornamento carta:
  // generato e salvato (hashato) su Supabase ad ogni fallimento di pagamento, così
  // il link inviato nella sequenza di dunning è sempre nuovo e verificabile lato server.
  const paymentLinkToken = await createPaymentToken({ customerId: customer.id, userId });

  const transaction = await recordFailedPayment({
    userId,
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
    hostedInvoiceUrl: invoice.hosted_invoice_url,
  });

  console.log(
    `[stripe-webhook] invoice.payment_failed ricevuto per fattura ${invoiceId} (cliente ${customer.id}): token di recupero generato su Supabase, valido 7 giorni.`
  );
  console.log(
    `[stripe-webhook] avvio dunning per fattura ${invoiceId}: customerEmail="${transaction.customerEmail}" paymentLinkToken=${paymentLinkToken ? "presente" : "assente"}`
  );

  await notifyPaymentFailed(transaction);
  await startDunningSequence(transaction);
}

async function handlePaymentSucceededForInvoiceId(invoiceId: string, userId: string) {
  const transaction = await markInvoiceRecovered(invoiceId, userId);
  if (transaction) {
    await stopDunningSequence(transaction);
    await notifyPaymentRecovered(transaction);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, userId: string) {
  if (!invoice.id) return;
  await handlePaymentSucceededForInvoiceId(invoice.id, userId);
}

/**
 * payment_intent.succeeded non porta un invoice_id diretto in questa versione
 * dell'API Stripe (l'oggetto Invoice non espone più `payment_intent` né
 * viceversa): risolviamo quindi la fattura da recuperare tramite lo Stripe
 * Customer ID, con lo stesso approccio già usato dal portale /pay/[token]
 * (src/lib/transactions.ts, getTransactionByCustomerId).
 */
async function handlePaymentIntentSucceeded(stripe: Stripe, paymentIntent: Stripe.PaymentIntent, userId: string) {
  const customer = await resolveCustomer(stripe, paymentIntent.customer);
  if (!customer.id) return;

  const transaction = await getTransactionByCustomerId(customer.id, userId);
  if (!transaction || transaction.status !== "in_corso") return;

  await handlePaymentSucceededForInvoiceId(transaction.invoiceId, userId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, userId: string) {
  const lost = await markSubscriptionLost(subscription.id, userId);
  for (const transaction of lost) {
    console.log(
      `[stripe-webhook] fattura ${transaction.invoiceId} segnata come "perso": abbonamento ${subscription.id} cancellato.`
    );
  }
}

/**
 * customer.source.expiring: Stripe la invia ~30 giorni prima che una carta
 * salvata scada (solo integrazioni Card/Source legacy — se il merchant usa
 * PaymentMethod questo evento non arriva mai, comportamento noto di Stripe).
 * Riusa il portale /pay/[token] già costruito per il recupero pagamenti
 * falliti: il token generato qui punta a un customer senza una fattura
 * fallita associata, la pagina lo riconosce come "aggiornamento preventivo"
 * (vedi src/app/pay/[token]/page.tsx).
 */
async function handleCustomerSourceExpiring(stripe: Stripe, source: Stripe.CustomerSource, userId: string) {
  if (source.object !== "card") return; // BankAccount/Account non hanno exp_month/exp_year in questa forma

  const customer = await resolveCustomer(stripe, source.customer ?? null);
  if (!customer.id || !customer.email) {
    console.warn(
      `[stripe-webhook] customer.source.expiring: email non risolvibile per il customer ${customer.id || "sconosciuto"}, invio saltato.`
    );
    return;
  }

  const token = await createPaymentToken({ customerId: customer.id, userId });
  await sendCardExpiringEmail({
    userId,
    to: customer.email,
    customerName: customer.name,
    last4: source.last4,
    expMonth: source.exp_month,
    expYear: source.exp_year,
    updateLink: `${getAppBaseUrl()}/pay/${token}`,
  });
}

/**
 * Riconciliazione utente: prova prima `client_reference_id` (impostato al
 * checkout, src/app/api/checkout/route.ts), poi lo `stripe_customer_id` già
 * collegato in precedenza, infine l'email del cliente Stripe — utile se il
 * checkout è ripartito da un contesto senza client_reference_id (es. un
 * link di pagamento generato a mano) ma l'email coincide con quella
 * dell'account RecoverPulse.
 */
async function resolvePlatformUserId(input: {
  clientReferenceId?: string | null;
  customerId: string | null;
  customerEmail?: string | null;
}): Promise<string | null> {
  if (input.clientReferenceId) return input.clientReferenceId;

  if (input.customerId) {
    const byCustomer = await getUserIdForStripeCustomer(input.customerId);
    if (byCustomer) return byCustomer;
  }

  if (input.customerEmail) {
    const user = await findUserByEmail(input.customerEmail);
    if (user) return user.id;
  }

  return null;
}

/**
 * Collega il customer Stripe all'utente e, se la sessione ha già un
 * abbonamento (mode "subscription"), ne recupera subito stato e piano
 * invece di aspettare customer.subscription.created/updated: Stripe non
 * garantisce l'ordine di arrivo tra i due eventi, quindi affidarsi al solo
 * evento abbonamento rischierebbe di lasciare il paywall bloccato per un
 * intervallo imprevedibile dopo un checkout già completato con successo.
 */
async function handleCheckoutSessionCompleted(stripe: Stripe, session: Stripe.Checkout.Session): Promise<void> {
  const customerId = typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);
  const customerEmail = session.customer_details?.email ?? session.customer_email ?? null;

  const userId = await resolvePlatformUserId({
    clientReferenceId: session.client_reference_id,
    customerId,
    customerEmail,
  });

  if (!userId) {
    console.warn(
      `[stripe-webhook] checkout.session.completed ${session.id}: nessun utente RecoverPulse risolto (client_reference_id assente, customer/email non associati). Sottoscrizione non collegata.`
    );
    return;
  }

  if (customerId) {
    await setStripeCustomerForUser(userId, customerId);
  }

  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await setSubscriptionForUser(userId, subscription.status, subscription.metadata?.planId ?? null);
    } catch (error) {
      console.error(
        `[stripe-webhook] impossibile recuperare l'abbonamento ${subscriptionId} dopo checkout.session.completed:`,
        error
      );
    }
  }
}

/**
 * customer.subscription.created/updated/deleted lato PIATTAFORMA (event.account
 * assente): traccia l'abbonamento SaaS di RecoverPulse dell'utente (per il
 * paywall, src/lib/paywall.ts), non va confuso con l'omonimo evento lato
 * account collegato (handleSubscriptionDeleted sopra, chiamato solo dal ramo
 * connectedAccountId, riguarda l'abbonamento di un CLIENTE del merchant).
 *
 * Risolve l'utente in ordine: `subscription.metadata.userId` (impostato al
 * checkout, src/app/api/checkout/route.ts) → `users.stripe_customer_id` già
 * collegato → email del customer Stripe (fallback finale, richiede una
 * chiamata API perché la Subscription non la porta inline). Stripe non
 * garantisce che checkout.session.completed arrivi prima di questo evento,
 * quindi collega anche qui stripe_customer_id: se questo evento arriva per
 * primo, il prossimo checkout.session.completed troverebbe comunque
 * l'utente già risolvibile via customer id.
 */
async function handlePlatformSubscriptionChange(stripe: Stripe, subscription: Stripe.Subscription): Promise<void> {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  let userId = subscription.metadata?.userId || (await getUserIdForStripeCustomer(customerId));

  if (!userId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      const email = !customer.deleted ? customer.email : null;
      if (email) {
        userId = (await findUserByEmail(email))?.id ?? null;
      }
    } catch (error) {
      console.error(
        `[stripe-webhook] impossibile risolvere l'email del customer ${customerId} per l'abbonamento ${subscription.id}:`,
        error
      );
    }
  }

  if (!userId) {
    console.warn(
      `[stripe-webhook] abbonamento piattaforma ${subscription.id} per il customer ${customerId} non associato a nessun utente RecoverPulse: ignorato.`
    );
    return;
  }

  await setStripeCustomerForUser(userId, customerId);
  await setSubscriptionForUser(userId, subscription.status, subscription.metadata?.planId ?? null);
}

/**
 * Verifica la firma provando entrambi i secret configurati: un endpoint
 * Stripe non può ricevere sia eventi "on your account" sia "on connected
 * accounts" con lo stesso secret, quindi in pratica servono due endpoint
 * (stessa URL) registrati in Stripe con due secret distinti. Proviamo prima
 * quello piattaforma, poi quello Connect.
 */
function verifySignature(stripe: Stripe, payload: string, signature: string): Stripe.Event {
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(
    (secret): secret is string => Boolean(secret)
  );

  let lastError: unknown;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Nessun secret webhook configurato.");
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  const platformStripe = await getPlatformStripeClient();
  const hasAnySecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_CONNECT_WEBHOOK_SECRET);

  let event: Stripe.Event;

  if (hasAnySecret && signature) {
    try {
      event = verifySignature(platformStripe, payload, signature);
    } catch (error) {
      console.error("Stripe webhook signature verification failed:", error);
      return NextResponse.json({ error: "Firma webhook non valida." }, { status: 400 });
    }
  } else if (process.env.NODE_ENV !== "production") {
    // Fallback dev/test: se nessun secret è ancora stato configurato in .env
    // (o la richiesta arriva senza firma, es. da un test locale con
    // curl/Postman), accettiamo il payload senza verificarne l'autenticità
    // invece di bloccare lo sviluppo. Disattivato in produzione (NODE_ENV
    // sempre "production" su Vercel), dove firma e secret restano obbligatori.
    console.warn(
      "[stripe-webhook] nessun secret webhook configurato o firma mancante: payload accettato senza verifica (solo dev/test)."
    );
    try {
      event = JSON.parse(payload) as Stripe.Event;
    } catch (error) {
      console.error("Payload webhook Stripe non valido (JSON malformato):", error);
      return NextResponse.json({ error: "Payload non valido." }, { status: 400 });
    }
  } else if (!hasAnySecret) {
    console.error("Nessuna STRIPE_WEBHOOK_SECRET/STRIPE_CONNECT_WEBHOOK_SECRET configurata.");
    return NextResponse.json({ error: "Webhook Stripe non configurato." }, { status: 500 });
  } else {
    // Secret configurato ma richiesta priva dell'header stripe-signature:
    // capita con chiamate "a mano" (curl/Postman) che non firmano il payload
    // come farebbe Stripe. Distinto dal caso sopra per non far credere che il
    // webhook non sia configurato quando in realtà lo è.
    console.error("[stripe-webhook] richiesta priva dell'header stripe-signature.");
    return NextResponse.json({ error: "Firma webhook mancante." }, { status: 400 });
  }

  // event.account presente = evento generato da un account collegato via
  // Stripe Connect (il merchant il cui pagamento è fallito/recuperato):
  // risolviamo quale utente RecoverPulse lo possiede e usiamo il suo client
  // Stripe per ogni chiamata API a valle. event.account assente = evento
  // della piattaforma RecoverPulse stessa (oggi solo checkout.session.completed,
  // il proprio billing SaaS) — nessun merchant coinvolto.
  const connectedAccountId = "account" in event ? (event.account as string | null | undefined) : null;

  try {
    if (connectedAccountId) {
      const userId = await getUserIdForStripeAccount(connectedAccountId);
      if (!userId) {
        console.warn(
          `[stripe-webhook] evento ${event.type} per l'account Stripe ${connectedAccountId}, non collegato a nessun utente RecoverPulse (disconnesso?): ignorato.`
        );
        return NextResponse.json({ received: true });
      }

      const stripe = await getStripeClientForAccount(connectedAccountId);

      switch (event.type) {
        case "invoice.payment_failed":
          await handleInvoicePaymentFailed(stripe, event.data.object, userId, connectedAccountId);
          break;
        case "invoice.payment_succeeded":
        case "invoice.paid":
          await handleInvoicePaymentSucceeded(event.data.object, userId);
          break;
        case "payment_intent.succeeded":
          await handlePaymentIntentSucceeded(stripe, event.data.object, userId);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event.data.object, userId);
          break;
        case "customer.source.expiring":
          await handleCustomerSourceExpiring(stripe, event.data.object, userId);
          break;
        default:
          break;
      }
    } else {
      // Nessun event.account: evento della piattaforma RecoverPulse stessa
      // (il proprio billing SaaS), non di un merchant collegato.
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(platformStripe, event.data.object);
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await handlePlatformSubscriptionChange(platformStripe, event.data.object);
          break;
        default:
          break;
      }
    }
  } catch (error) {
    console.error(`Errore durante la gestione dell'evento Stripe ${event.type}:`, error);
    return NextResponse.json({ error: "Errore interno durante la gestione dell'evento." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
