import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type MerchantSettings = {
  companyName: string;
  supportEmail: string;
  logoUrl: string | null;
  primaryColor: string;
};

// RecoverPulse è a singolo merchant per deploy (vedi la migration): un'unica
// riga identificata da questo id fisso, sempre la stessa a ogni upsert.
const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export const DEFAULT_MERCHANT_SETTINGS: MerchantSettings = {
  companyName: "RecoverPulse",
  supportEmail: "",
  logoUrl: null,
  primaryColor: "#10b981",
};

type MerchantSettingsRow = {
  company_name: string;
  support_email: string;
  logo_url: string | null;
  primary_color: string;
};

function mapRow(row: MerchantSettingsRow): MerchantSettings {
  return {
    companyName: row.company_name,
    supportEmail: row.support_email,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
  };
}

/**
 * Legge le impostazioni di brand del merchant. Se la riga non esiste ancora
 * (nessun salvataggio da /dashboard/impostazioni) o Supabase non è
 * raggiungibile, ritorna i default RecoverPulse invece di far fallire la
 * pagina /pay o l'invio delle email di dunning.
 */
export async function getMerchantSettings(): Promise<MerchantSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from("merchant_settings")
      .select("company_name, support_email, logo_url, primary_color")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error("[merchant-settings] errore nel recupero da Supabase:", error.message);
      return DEFAULT_MERCHANT_SETTINGS;
    }

    return data ? mapRow(data) : DEFAULT_MERCHANT_SETTINGS;
  } catch (error) {
    console.error("[merchant-settings] eccezione imprevista nel recupero da Supabase:", error);
    return DEFAULT_MERCHANT_SETTINGS;
  }
}

export async function updateMerchantSettings(input: MerchantSettings): Promise<MerchantSettings> {
  const { data, error } = await supabaseAdmin
    .from("merchant_settings")
    .upsert(
      {
        id: SETTINGS_ID,
        company_name: input.companyName,
        support_email: input.supportEmail,
        logo_url: input.logoUrl,
        primary_color: input.primaryColor,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("company_name, support_email, logo_url, primary_color")
    .single();

  if (error) {
    throw new Error(`Errore nel salvataggio delle impostazioni merchant su Supabase: ${error.message}`);
  }

  return mapRow(data);
}
