import "server-only";

import { getStripeClientForAccount } from "@/lib/stripe";
import { getStripeAccountIdForUser } from "@/lib/connected-stripe-accounts";

/**
 * Prova a creare un SetupIntent Stripe reale per un customer, usando il
 * client dell'account Stripe collegato al merchant proprietario (`userId`).
 * Restituisce `null` se fallisce per qualunque motivo — merchant senza
 * Stripe ancora collegato, customer Stripe inesistente (caso delle
 * transazioni di test generate da /api/test/generate-failed-payment), o un
 * errore di rete — cosa che fa entrare il portale /pay/[token] in modalità
 * "Simulazione" invece di bloccare l'utente su un errore Stripe. Usata sia
 * dalla pagina per decidere quale form mostrare, sia dalla route di conferma
 * per autorizzare la conferma simulata solo quando un vero SetupIntent non è
 * comunque ottenibile. Accetta `{userId, customerId}` invece di una
 * `FailedTransaction` intera perché serve anche per il caso "aggiornamento
 * preventivo" (customer.source.expiring), dove non esiste ancora una fattura
 * fallita da cui prenderli.
 */
export async function tryCreateSetupIntent({
  userId,
  customerId,
}: {
  userId: string;
  customerId: string;
}): Promise<string | null> {
  try {
    const stripeAccountId = await getStripeAccountIdForUser(userId);
    if (!stripeAccountId) return null;

    const stripe = await getStripeClientForAccount(stripeAccountId);
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
    });
    return setupIntent.client_secret;
  } catch (error) {
    console.error(`[payment-portal] impossibile creare il SetupIntent Stripe per il customer ${customerId}:`, error);
    return null;
  }
}
