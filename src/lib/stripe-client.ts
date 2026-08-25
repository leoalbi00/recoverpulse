import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | undefined;
let loadedKey: string | undefined;

/**
 * Carica Stripe.js con la Publishable Key passata dal server (risolta in
 * src/app/pay/[token]/page.tsx da Supabase con fallback a
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY): il browser non ha accesso diretto a
 * Supabase, quindi non può risolvere da sé la chiave salvata dalla dashboard.
 */
export function getStripe(publishableKey: string) {
  if (!stripePromise || loadedKey !== publishableKey) {
    stripePromise = loadStripe(publishableKey);
    loadedKey = publishableKey;
  }
  return stripePromise;
}
