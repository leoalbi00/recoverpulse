import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type MerchantSettings = {
  firstName: string;
  lastName: string;
  companyName: string;
  vatNumber: string;
  legalAddress: string;
  supportEmail: string;
  phone: string;
  logoUrl: string | null;
  primaryColor: string;
  senderName: string | null;
};

export const DEFAULT_MERCHANT_SETTINGS: MerchantSettings = {
  firstName: "",
  lastName: "",
  companyName: "RecoverPulse",
  vatNumber: "",
  legalAddress: "",
  supportEmail: "",
  phone: "",
  logoUrl: null,
  primaryColor: "#10b981",
  senderName: null,
};

type MerchantSettingsRow = {
  first_name: string;
  last_name: string;
  company_name: string;
  vat_number: string;
  legal_address: string;
  support_email: string;
  phone: string;
  logo_url: string | null;
  primary_color: string;
  sender_name: string | null;
};

const MERCHANT_SETTINGS_COLUMNS =
  "first_name, last_name, company_name, vat_number, legal_address, support_email, phone, logo_url, primary_color, sender_name";

function mapRow(row: MerchantSettingsRow): MerchantSettings {
  return {
    firstName: row.first_name,
    lastName: row.last_name,
    companyName: row.company_name,
    vatNumber: row.vat_number,
    legalAddress: row.legal_address,
    supportEmail: row.support_email,
    phone: row.phone,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    senderName: row.sender_name,
  };
}

/**
 * Vero se tutti i dati legali/fiscali obbligatori del profilo merchant sono
 * compilati: nome, cognome, ragione sociale, email di contatto, telefono,
 * partita IVA/codice fiscale e indirizzo di sede legale. Il banner
 * "Completa i dati aziendali obbligatori" in /dashboard/impostazioni si basa
 * su questo controllo. Logo, colore e nome mittente (Brand &
 * Personalizzazione) restano opzionali e non entrano in questo calcolo.
 */
export function isMerchantProfileComplete(settings: MerchantSettings): boolean {
  return (
    settings.firstName.trim().length > 0 &&
    settings.lastName.trim().length > 0 &&
    settings.companyName.trim().length > 0 &&
    settings.vatNumber.trim().length > 0 &&
    settings.legalAddress.trim().length > 0 &&
    settings.supportEmail.trim().length > 0 &&
    settings.phone.trim().length > 0
  );
}

/**
 * Legge le impostazioni del merchant collegato `userId`. Se la riga non
 * esiste ancora (nessun salvataggio da /dashboard/impostazioni) o Supabase
 * non è raggiungibile, ritorna i default RecoverPulse invece di far fallire
 * la pagina /pay o l'invio delle email di dunning.
 */
export async function getMerchantSettings(userId: string): Promise<MerchantSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from("merchant_settings")
      .select(MERCHANT_SETTINGS_COLUMNS)
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

/**
 * Aggiorna solo i campi presenti in `input`, incrociati con quanto già
 * salvato: /dashboard/impostazioni ora divide il profilo merchant in due
 * form indipendenti (dati legali in alto, brand in fondo — vedi
 * merchant-legal-profile-panel.tsx e brand-settings-panel.tsx), ognuno con
 * il proprio pulsante Salva. Un merge esplicito evita che il salvataggio di
 * un form sovrascriva con valori vuoti i campi di competenza dell'altro.
 */
export async function updateMerchantSettings(
  input: Partial<MerchantSettings>,
  userId: string,
): Promise<MerchantSettings> {
  const current = await getMerchantSettings(userId);
  const merged: MerchantSettings = { ...current, ...input };

  const { data, error } = await supabaseAdmin
    .from("merchant_settings")
    .upsert(
      {
        user_id: userId,
        first_name: merged.firstName,
        last_name: merged.lastName,
        company_name: merged.companyName,
        vat_number: merged.vatNumber,
        legal_address: merged.legalAddress,
        support_email: merged.supportEmail,
        phone: merged.phone,
        logo_url: merged.logoUrl,
        primary_color: merged.primaryColor,
        sender_name: merged.senderName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select(MERCHANT_SETTINGS_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Errore nel salvataggio delle impostazioni merchant su Supabase: ${error.message}`);
  }

  return mapRow(data);
}
