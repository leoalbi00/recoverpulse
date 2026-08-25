import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type IntegrationSettings = {
  stripePublishableKey: string;
  stripeSecretKey: string;
  resendApiKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
};

// RecoverPulse è a singolo merchant per deploy (vedi la migration): un'unica
// riga identificata da questo id fisso, sempre la stessa a ogni upsert.
const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

const DEFAULT_INTEGRATION_SETTINGS: IntegrationSettings = {
  stripePublishableKey: "",
  stripeSecretKey: "",
  resendApiKey: "",
  twilioAccountSid: "",
  twilioAuthToken: "",
};

type IntegrationSettingsRow = {
  stripe_publishable_key: string;
  stripe_secret_key: string;
  resend_api_key: string;
  twilio_account_sid: string;
  twilio_auth_token: string;
};

function mapRow(row: IntegrationSettingsRow): IntegrationSettings {
  return {
    stripePublishableKey: row.stripe_publishable_key,
    stripeSecretKey: row.stripe_secret_key,
    resendApiKey: row.resend_api_key,
    twilioAccountSid: row.twilio_account_sid,
    twilioAuthToken: row.twilio_auth_token,
  };
}

/**
 * Legge le chiavi API salvate dalla dashboard. Se la riga non esiste ancora o
 * Supabase non è raggiungibile, ritorna chiavi vuote invece di far fallire il
 * chiamante: chi usa queste chiavi (src/lib/stripe.ts, src/lib/email.ts, ...)
 * ricade poi sulle variabili d'ambiente.
 */
export async function getIntegrationSettings(): Promise<IntegrationSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from("integration_settings")
      .select("stripe_publishable_key, stripe_secret_key, resend_api_key, twilio_account_sid, twilio_auth_token")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error("[integration-settings] errore nel recupero da Supabase:", error.message);
      return DEFAULT_INTEGRATION_SETTINGS;
    }

    return data ? mapRow(data) : DEFAULT_INTEGRATION_SETTINGS;
  } catch (error) {
    console.error("[integration-settings] eccezione imprevista nel recupero da Supabase:", error);
    return DEFAULT_INTEGRATION_SETTINGS;
  }
}

export async function updateIntegrationSettings(
  partial: Partial<IntegrationSettings>
): Promise<IntegrationSettings> {
  const current = await getIntegrationSettings();
  const next = { ...current, ...partial };

  const { data, error } = await supabaseAdmin
    .from("integration_settings")
    .upsert(
      {
        id: SETTINGS_ID,
        stripe_publishable_key: next.stripePublishableKey,
        stripe_secret_key: next.stripeSecretKey,
        resend_api_key: next.resendApiKey,
        twilio_account_sid: next.twilioAccountSid,
        twilio_auth_token: next.twilioAuthToken,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("stripe_publishable_key, stripe_secret_key, resend_api_key, twilio_account_sid, twilio_auth_token")
    .single();

  if (error) {
    throw new Error(`Errore nel salvataggio delle chiavi API su Supabase: ${error.message}`);
  }

  return mapRow(data);
}

/** Mostra solo le ultime 4 cifre di un secret, per conferma visiva senza esporlo. */
export function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "•".repeat(value.length);
  return `${"•".repeat(value.length - 4)}${value.slice(-4)}`;
}
