import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type MerchantSettings = {
  companyName: string;
  supportEmail: string;
  phone: string;
  logoUrl: string | null;
  primaryColor: string;
};

export const DEFAULT_MERCHANT_SETTINGS: MerchantSettings = {
  companyName: "RecoverPulse",
  supportEmail: "",
  phone: "",
  logoUrl: null,
  primaryColor: "#10b981",
};

type MerchantSettingsRow = {
  company_name: string;
  support_email: string;
  phone: string;
  logo_url: string | null;
  primary_color: string;
};

function mapRow(row: MerchantSettingsRow): MerchantSettings {
  return {
    companyName: row.company_name,
    supportEmail: row.support_email,
    phone: row.phone,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
  };
}

/**
 * Vero se Nome Azienda, Email Aziendale e Telefono sono tutti compilati:
 * i tre campi obbligatori del profilo mostrati dal banner rosso in
 * /dashboard/impostazioni finché il merchant non li completa.
 */
export function isMerchantProfileComplete(settings: MerchantSettings): boolean {
  return (
    settings.companyName.trim().length > 0 &&
    settings.supportEmail.trim().length > 0 &&
    settings.phone.trim().length > 0
  );
}

/**
 * Legge le impostazioni di brand del merchant collegato `userId`. Se la riga
 * non esiste ancora (nessun salvataggio da /dashboard/impostazioni) o
 * Supabase non è raggiungibile, ritorna i default RecoverPulse invece di far
 * fallire la pagina /pay o l'invio delle email di dunning.
 */
export async function getMerchantSettings(userId: string): Promise<MerchantSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from("merchant_settings")
      .select("company_name, support_email, phone, logo_url, primary_color")
      .eq("user_id", userId)
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

export async function updateMerchantSettings(input: MerchantSettings, userId: string): Promise<MerchantSettings> {
  const { data, error } = await supabaseAdmin
    .from("merchant_settings")
    .upsert(
      {
        user_id: userId,
        company_name: input.companyName,
        support_email: input.supportEmail,
        phone: input.phone,
        logo_url: input.logoUrl,
        primary_color: input.primaryColor,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("company_name, support_email, phone, logo_url, primary_color")
    .single();

  if (error) {
    throw new Error(`Errore nel salvataggio delle impostazioni merchant su Supabase: ${error.message}`);
  }

  return mapRow(data);
}
