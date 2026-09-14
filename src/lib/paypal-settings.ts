import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type PaypalSettings = {
  clientId: string;
  clientSecret: string;
  /** Webhook ID assegnato da PayPal alla registrazione dell'URL webhook nel Developer Dashboard del merchant, richiesto da verify-webhook-signature. */
  webhookId: string;
};

const DEFAULT_SETTINGS: PaypalSettings = { clientId: "", clientSecret: "", webhookId: "" };

type PaypalSettingsRow = {
  client_id: string;
  client_secret: string;
  webhook_id: string;
};

function mapRow(row: PaypalSettingsRow): PaypalSettings {
  return { clientId: row.client_id, clientSecret: row.client_secret, webhookId: row.webhook_id };
}

/** Legge le credenziali PayPal del merchant, o valori vuoti se non ancora configurate. */
export async function getPaypalSettings(userId: string): Promise<PaypalSettings> {
  const { data, error } = await supabaseAdmin
    .from("paypal_settings")
    .select("client_id, client_secret, webhook_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nel recupero delle credenziali PayPal su Supabase: ${error.message}`);
  }

  return data ? mapRow(data) : DEFAULT_SETTINGS;
}

export async function updatePaypalSettings(
  userId: string,
  partial: Partial<PaypalSettings>
): Promise<PaypalSettings> {
  const current = await getPaypalSettings(userId);
  const next = { ...current, ...partial };

  const { data, error } = await supabaseAdmin
    .from("paypal_settings")
    .upsert(
      {
        user_id: userId,
        client_id: next.clientId,
        client_secret: next.clientSecret,
        webhook_id: next.webhookId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("client_id, client_secret, webhook_id")
    .single();

  if (error) {
    throw new Error(`Errore nel salvataggio delle credenziali PayPal su Supabase: ${error.message}`);
  }

  return mapRow(data);
}

export function isPaypalConfigured(settings: PaypalSettings): boolean {
  return Boolean(settings.clientId && settings.clientSecret);
}
