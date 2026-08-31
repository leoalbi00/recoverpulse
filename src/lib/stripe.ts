import "server-only";
import Stripe from "stripe";

import { getIntegrationSettings } from "@/lib/integration-settings";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Client Stripe della piattaforma RecoverPulse (mai di un merchant
 * connesso): usato per il billing SaaS di RecoverPulse stesso
 * (src/app/api/checkout/route.ts, src/app/api/dashboard/billing-portal/route.ts)
 * e per lo scambio del codice OAuth Stripe Connect
 * (src/app/api/stripe/connect/*), che deve avvenire con la Secret Key della
 * piattaforma, non con quella di un account collegato.
 */
export async function getPlatformStripeClient(): Promise<Stripe> {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
}

/**
 * Client Stripe che opera "per conto" di uno specifico account collegato via
 * OAuth Stripe Connect. Per gli Standard account l'access_token restituito
 * dallo scambio OAuth è di per sé equivalente a una secret key con scope su
 * quell'account, quindi basta istanziare Stripe con quel token — nessuna
 * opzione { stripeAccount } necessaria (vedi
 * node_modules/stripe/.../OAuth.d.ts).
 */
export async function getStripeClientForAccount(stripeAccountId: string): Promise<Stripe> {
  const { data, error } = await supabaseAdmin
    .from("connected_stripe_accounts")
    .select("access_token")
    .eq("stripe_account_id", stripeAccountId)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nel recupero dell'account Stripe collegato su Supabase: ${error.message}`);
  }
  if (!data) {
    throw new Error(`Nessun account Stripe collegato trovato per ${stripeAccountId}.`);
  }

  return new Stripe(data.access_token);
}

/** Publishable Key dell'account collegato, da passare a Stripe.js lato client (portale /pay/[token]). */
export async function getStripePublishableKeyForAccount(stripeAccountId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("connected_stripe_accounts")
    .select("publishable_key")
    .eq("stripe_account_id", stripeAccountId)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nel recupero della publishable key su Supabase: ${error.message}`);
  }

  return data?.publishable_key || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
}

/**
 * @deprecated Risolveva la Secret Key dall'unica riga globale
 * `integration_settings`, da quando RecoverPulse era single-tenant. Nessun
 * chiamante rimasto (sostituito da getPlatformStripeClient/
 * getStripeClientForAccount) — tenuta solo per non rompere import esterni
 * non ancora aggiornati; non aggiungere nuovi chiamanti.
 */
export async function getStripeClient(): Promise<Stripe> {
  const settings = await getIntegrationSettings();
  const secretKey = settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY || "";
  return new Stripe(secretKey);
}

/** @deprecated Vedi getStripeClient — usa getStripePublishableKeyForAccount. */
export async function getStripePublishableKey(): Promise<string> {
  const settings = await getIntegrationSettings();
  return settings.stripePublishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
}
