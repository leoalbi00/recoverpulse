import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type BillingInfo = {
  stripeCustomerId: string | null;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
};

/** Collegato dal webhook piattaforma (checkout.session.completed) al primo checkout riuscito. */
export async function setStripeCustomerForUser(userId: string, customerId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("users").update({ stripe_customer_id: customerId }).eq("id", userId);
  if (error) {
    throw new Error(`Errore nel salvataggio del customer Stripe su Supabase: ${error.message}`);
  }
}

/**
 * Non lancia mai (a differenza delle funzioni di scrittura sopra/sotto,
 * chiamate solo dal webhook che ha già un try/catch a monte): letta anche da
 * Server Component (/dashboard/impostazioni, /dashboard/api/dashboard/billing-portal),
 * un errore qui non deve far fallire il render della pagina.
 */
export async function getStripeCustomerForUser(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("[billing] errore nel recupero del customer Stripe da Supabase:", error.message);
      return null;
    }
    return data?.stripe_customer_id ?? null;
  } catch (error) {
    console.error("[billing] eccezione imprevista nel recupero del customer Stripe da Supabase:", error);
    return null;
  }
}

/** Usata dal webhook piattaforma per risalire all'utente da `subscription.customer` (customer.subscription.*). */
export async function getUserIdForStripeCustomer(stripeCustomerId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();
  if (error) {
    throw new Error(`Errore nella risoluzione dell'utente da Supabase: ${error.message}`);
  }
  return data?.id ?? null;
}

export async function setSubscriptionForUser(userId: string, status: string, plan: string | null): Promise<void> {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ subscription_status: status, subscription_plan: plan })
    .eq("id", userId);
  if (error) {
    throw new Error(`Errore nell'aggiornamento dell'abbonamento su Supabase: ${error.message}`);
  }
}

const DEFAULT_BILLING_INFO: BillingInfo = {
  stripeCustomerId: null,
  subscriptionStatus: null,
  subscriptionPlan: null,
};

/**
 * Usata da src/lib/paywall.ts e da /dashboard/impostazioni per mostrare
 * piano/stato correnti. Non lancia mai: paywall.ts è chiamata da
 * /dashboard/page.tsx senza try/catch, un errore Supabase qui non deve
 * rompere il render dell'intera dashboard (stesso principio di
 * getMerchantSettings/getDunningSettings/getIntegrationSettings, che
 * ricadono tutte su default invece di lanciare).
 */
export async function getBillingInfoForUser(userId: string): Promise<BillingInfo> {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("stripe_customer_id, subscription_status, subscription_plan")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("[billing] errore nel recupero dello stato abbonamento da Supabase:", error.message);
      return DEFAULT_BILLING_INFO;
    }
    return {
      stripeCustomerId: data?.stripe_customer_id ?? null,
      subscriptionStatus: data?.subscription_status ?? null,
      subscriptionPlan: data?.subscription_plan ?? null,
    };
  } catch (error) {
    console.error("[billing] eccezione imprevista nel recupero dello stato abbonamento da Supabase:", error);
    return DEFAULT_BILLING_INFO;
  }
}
