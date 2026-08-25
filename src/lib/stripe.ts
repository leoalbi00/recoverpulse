import "server-only";
import Stripe from "stripe";

import { getIntegrationSettings } from "@/lib/integration-settings";

/**
 * Client Stripe risolto a runtime: usa la Secret Key salvata da
 * /dashboard/impostazioni su Supabase se presente, altrimenti STRIPE_SECRET_KEY
 * da env. Una chiave salvata dalla dashboard ha così effetto immediato su
 * tutte le chiamate Stripe dell'app, senza toccare .env né rideployare.
 */
export async function getStripeClient(): Promise<Stripe> {
  const settings = await getIntegrationSettings();
  const secretKey = settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY || "";
  return new Stripe(secretKey);
}

/** Publishable Key da passare a Stripe.js lato client (vedi src/lib/stripe-client.ts). */
export async function getStripePublishableKey(): Promise<string> {
  const settings = await getIntegrationSettings();
  return settings.stripePublishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
}
