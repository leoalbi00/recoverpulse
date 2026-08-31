import "server-only";

import { getStripeClientForAccount } from "@/lib/stripe";
import { getStripeAccountIdForUser } from "@/lib/connected-stripe-accounts";
import type { FailedTransaction } from "@/lib/transactions";

/**
 * Prova a creare un SetupIntent Stripe reale per la transazione, usando il
 * client dell'account Stripe collegato al merchant proprietario
 * (transaction.userId). Restituisce `null` se fallisce per qualunque motivo
 * — merchant senza Stripe ancora collegato, customer Stripe inesistente
 * (caso delle transazioni di test generate da
 * /api/test/generate-failed-payment), o un errore di rete — cosa che fa
 * entrare il portale /pay/[token] in modalità "Simulazione" invece di
 * bloccare l'utente su un errore Stripe. Usata sia dalla pagina per decidere
 * quale form mostrare, sia dalla route di conferma per autorizzare la
 * conferma simulata solo quando un vero SetupIntent non è comunque
 * ottenibile.
 */
export async function tryCreateSetupIntent(transaction: FailedTransaction): Promise<string | null> {
  try {
    const stripeAccountId = await getStripeAccountIdForUser(transaction.userId);
    if (!stripeAccountId) return null;

    const stripe = await getStripeClientForAccount(stripeAccountId);
    const setupIntent = await stripe.setupIntents.create({
      customer: transaction.customerId,
      payment_method_types: ["card"],
      usage: "off_session",
    });
    return setupIntent.client_secret;
  } catch (error) {
    console.error(
      `[payment-portal] impossibile creare il SetupIntent Stripe per il customer ${transaction.customerId}:`,
      error
    );
    return null;
  }
}
