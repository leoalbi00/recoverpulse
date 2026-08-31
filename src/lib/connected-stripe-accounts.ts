import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type ConnectedStripeAccount = {
  stripeAccountId: string;
  userId: string;
  accessToken: string;
  publishableKey: string | null;
  livemode: boolean;
  trialStartedAt: string;
};

type ConnectedStripeAccountRow = {
  stripe_account_id: string;
  user_id: string;
  access_token: string;
  publishable_key: string | null;
  livemode: boolean;
  trial_started_at: string;
};

function mapRow(row: ConnectedStripeAccountRow): ConnectedStripeAccount {
  return {
    stripeAccountId: row.stripe_account_id,
    userId: row.user_id,
    accessToken: row.access_token,
    publishableKey: row.publishable_key,
    livemode: row.livemode,
    trialStartedAt: row.trial_started_at,
  };
}

/**
 * Registra (o riassocia) un account Stripe collegato via OAuth
 * (src/app/api/stripe/connect/callback/route.ts). L'upsert è su
 * `stripe_account_id` e OMETTE deliberatamente `trial_started_at` dal
 * payload: la colonna ha un default `now()` applicato solo al primo insert,
 * mai toccato da un conflitto successivo, così i 14 giorni di prova restano
 * legati allo Stripe account per sempre, anche se viene ricollegato da un
 * altro utente RecoverPulse (vedi il trasferimento di proprietà nella route
 * di callback, che chiama questa funzione).
 */
export async function upsertConnectedStripeAccount(input: {
  stripeAccountId: string;
  userId: string;
  accessToken: string;
  refreshToken?: string | null;
  publishableKey?: string | null;
  scope?: string | null;
  livemode: boolean;
}): Promise<ConnectedStripeAccount> {
  const { data, error } = await supabaseAdmin
    .from("connected_stripe_accounts")
    .upsert(
      {
        stripe_account_id: input.stripeAccountId,
        user_id: input.userId,
        access_token: input.accessToken,
        refresh_token: input.refreshToken ?? null,
        publishable_key: input.publishableKey ?? null,
        scope: input.scope ?? null,
        livemode: input.livemode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_account_id" }
    )
    .select("stripe_account_id, user_id, access_token, publishable_key, livemode, trial_started_at")
    .single();

  if (error) {
    throw new Error(`Errore nel salvataggio dell'account Stripe collegato su Supabase: ${error.message}`);
  }

  return mapRow(data);
}

export async function getConnectedAccountForUser(userId: string): Promise<ConnectedStripeAccount | null> {
  const { data, error } = await supabaseAdmin
    .from("connected_stripe_accounts")
    .select("stripe_account_id, user_id, access_token, publishable_key, livemode, trial_started_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nel recupero dell'account Stripe collegato su Supabase: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

/** Usata dal webhook (`event.account`) per risolvere quale utente RecoverPulse possiede l'account che ha generato l'evento. */
export async function getUserIdForStripeAccount(stripeAccountId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("connected_stripe_accounts")
    .select("user_id")
    .eq("stripe_account_id", stripeAccountId)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nella risoluzione dell'account Stripe collegato su Supabase: ${error.message}`);
  }

  return data?.user_id ?? null;
}

/**
 * Legge lo `stripe_account_id` collegato all'utente (colonna su `users`,
 * popolata dal callback OAuth). Usata dai percorsi che devono chiamare
 * Stripe "per conto" di un utente dashboard (es. il resend manuale di un
 * sollecito) senza dover risalire dalla transazione.
 */
export async function getStripeAccountIdForUser(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.from("users").select("stripe_account_id").eq("id", userId).maybeSingle();

  if (error) {
    throw new Error(`Errore nella lettura dell'account Stripe collegato su Supabase: ${error.message}`);
  }

  return data?.stripe_account_id ?? null;
}

/** Collega `stripeAccountId` all'utente dopo lo scambio OAuth (callback route). */
export async function setStripeAccountIdForUser(userId: string, stripeAccountId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("users").update({ stripe_account_id: stripeAccountId }).eq("id", userId);

  if (error) {
    throw new Error(`Errore nel collegamento dell'account Stripe all'utente su Supabase: ${error.message}`);
  }
}

/**
 * Disconnette Stripe per l'utente: azzera solo `users.stripe_account_id`.
 * La riga in `connected_stripe_accounts` (e il suo `trial_started_at`)
 * resta intatta per sempre — è il registro permanente che impedisce di
 * resettare la prova ricollegando lo stesso account in futuro.
 */
export async function clearStripeAccountForUser(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("users").update({ stripe_account_id: null }).eq("id", userId);

  if (error) {
    throw new Error(`Errore nella disconnessione dell'account Stripe su Supabase: ${error.message}`);
  }
}

/** Tutti gli account collegati, usata dal cron di dunning per il loop per-account (src/app/api/cron/dunning/route.ts). */
export async function listConnectedAccountUserIds(): Promise<string[]> {
  const { data, error } = await supabaseAdmin.from("connected_stripe_accounts").select("user_id");

  if (error) {
    throw new Error(`Errore nel recupero degli account Stripe collegati su Supabase: ${error.message}`);
  }

  return (data ?? []).map((row) => row.user_id);
}
