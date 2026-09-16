import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { encryptSecret, decryptSecret } from "@/lib/encryption";
import type { PaypalEnvironment } from "@/lib/paypal";

export type PaypalSettings = {
  /** Merchant/Payer ID assegnato da PayPal al merchant collegato (identity, non credenziale). */
  merchantId: string;
  email: string | null;
  /** Access token OAuth "third-party" scoped sul merchant, decifrato. */
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  /** Webhook ID assegnato da PayPal alla registrazione automatica dell'URL webhook (src/lib/paypal-partner.ts). */
  webhookId: string;
  connectedAt: string | null;
  /** Ambiente PayPal (live/sandbox) usato al momento del collegamento (src/lib/paypal.ts, PAYPAL_ENV): fissato per questa connessione, indipendentemente da eventuali cambi successivi della variabile d'ambiente globale. */
  environment: PaypalEnvironment;
};

const EMPTY_SETTINGS: PaypalSettings = {
  merchantId: "",
  email: null,
  accessToken: "",
  refreshToken: null,
  tokenExpiresAt: null,
  webhookId: "",
  connectedAt: null,
  environment: "live",
};

type PaypalSettingsRow = {
  merchant_id: string;
  email: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  webhook_id: string;
  connected_at: string | null;
  environment: PaypalEnvironment;
};

function mapRow(row: PaypalSettingsRow): PaypalSettings {
  return {
    merchantId: row.merchant_id,
    email: row.email,
    accessToken: row.access_token ? decryptSecret(row.access_token) : "",
    refreshToken: row.refresh_token ? decryptSecret(row.refresh_token) : null,
    tokenExpiresAt: row.token_expires_at,
    webhookId: row.webhook_id,
    connectedAt: row.connected_at,
    environment: row.environment ?? "live",
  };
}

/** Legge la connessione PayPal del merchant, o valori vuoti se non ancora collegato. */
export async function getPaypalSettings(userId: string): Promise<PaypalSettings> {
  const { data, error } = await supabaseAdmin
    .from("paypal_settings")
    .select("merchant_id, email, access_token, refresh_token, token_expires_at, webhook_id, connected_at, environment")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nel recupero della connessione PayPal su Supabase: ${error.message}`);
  }

  return data ? mapRow(data) : EMPTY_SETTINGS;
}

/**
 * Salva la connessione completata dal callback OAuth Partner
 * (src/app/api/paypal/connect/callback/route.ts): access_token e
 * refresh_token sono cifrati prima del salvataggio (src/lib/encryption.ts).
 */
export async function savePaypalConnection(
  userId: string,
  input: {
    merchantId: string;
    email: string | null;
    accessToken: string;
    refreshToken: string | null;
    expiresInSeconds: number | null;
    webhookId: string;
    environment: PaypalEnvironment;
  }
): Promise<void> {
  const tokenExpiresAt = input.expiresInSeconds
    ? new Date(Date.now() + input.expiresInSeconds * 1000).toISOString()
    : null;

  const { error } = await supabaseAdmin.from("paypal_settings").upsert(
    {
      user_id: userId,
      merchant_id: input.merchantId,
      email: input.email,
      access_token: encryptSecret(input.accessToken),
      refresh_token: input.refreshToken ? encryptSecret(input.refreshToken) : null,
      token_expires_at: tokenExpiresAt,
      webhook_id: input.webhookId,
      environment: input.environment,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(`Errore nel salvataggio della connessione PayPal su Supabase: ${error.message}`);
  }
}

/**
 * Aggiorna solo access_token/refresh_token dopo un refresh OAuth
 * (src/lib/paypal-partner.ts, getValidPaypalAccessToken): `refreshToken`
 * omesso lascia invariato quello già salvato, dato che PayPal non ne emette
 * sempre uno nuovo ad ogni refresh.
 */
export async function updatePaypalTokens(
  userId: string,
  input: { accessToken: string; refreshToken: string | null; expiresInSeconds: number | null }
): Promise<void> {
  const tokenExpiresAt = input.expiresInSeconds
    ? new Date(Date.now() + input.expiresInSeconds * 1000).toISOString()
    : null;

  const { error } = await supabaseAdmin
    .from("paypal_settings")
    .update({
      access_token: encryptSecret(input.accessToken),
      ...(input.refreshToken ? { refresh_token: encryptSecret(input.refreshToken) } : {}),
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Errore nell'aggiornamento dei token PayPal su Supabase: ${error.message}`);
  }
}

/** Disconnette PayPal per l'utente: elimina la riga di connessione. */
export async function clearPaypalSettings(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("paypal_settings").delete().eq("user_id", userId);

  if (error) {
    throw new Error(`Errore nella disconnessione PayPal su Supabase: ${error.message}`);
  }
}

export function isPaypalConfigured(settings: PaypalSettings): boolean {
  return Boolean(settings.merchantId && settings.accessToken);
}
