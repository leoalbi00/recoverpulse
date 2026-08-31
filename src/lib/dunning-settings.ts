import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type DunningChannel = "whatsapp" | "sms" | "email";

export type DunningStep = "step1" | "step2" | "step3";

export type DunningSettings = {
  channels: Record<DunningChannel, boolean>;
  /** Minuti di attesa dopo il pagamento fallito, per ciascun passaggio della sequenza. */
  timing: Record<DunningStep, number>;
};

// RecoverPulse è a singolo merchant per deploy (vedi la migration): un'unica
// riga identificata da questo id fisso, sempre la stessa a ogni upsert.
const SETTINGS_ID = "default";

function defaultSettings(): DunningSettings {
  return {
    // whatsapp/sms restano false: nessuna integrazione Twilio/WhatsApp
    // Business API è ancora implementata (vedi src/lib/dunning.ts), quindi
    // attivarli di default mostrerebbe un canale che in realtà non invia
    // nulla. Il toggle relativo è disabilitato anche in dashboard (vedi
    // src/components/dashboard/dunning-sequences-panel.tsx).
    channels: { whatsapp: false, sms: false, email: true },
    timing: { step1: 5, step2: 12 * 60, step3: 24 * 60 },
  };
}

type DunningSettingsRow = {
  channel_whatsapp: boolean;
  channel_sms: boolean;
  channel_email: boolean;
  timing_step1_minutes: number;
  timing_step2_minutes: number;
  timing_step3_minutes: number;
};

function mapRow(row: DunningSettingsRow): DunningSettings {
  return {
    channels: {
      whatsapp: row.channel_whatsapp,
      sms: row.channel_sms,
      email: row.channel_email,
    },
    timing: {
      step1: row.timing_step1_minutes,
      step2: row.timing_step2_minutes,
      step3: row.timing_step3_minutes,
    },
  };
}

/**
 * Legge canali attivi e timing della sequenza dunning da Supabase. Se la riga
 * non esiste ancora o Supabase non è raggiungibile, ritorna i default invece
 * di far fallire il webhook Stripe o la dashboard.
 */
export async function getDunningSettings(): Promise<DunningSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from("dunning_settings")
      .select(
        "channel_whatsapp, channel_sms, channel_email, timing_step1_minutes, timing_step2_minutes, timing_step3_minutes"
      )
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error("[dunning-settings] errore nel recupero da Supabase:", error.message);
      return defaultSettings();
    }

    return data ? mapRow(data) : defaultSettings();
  } catch (error) {
    console.error("[dunning-settings] eccezione imprevista nel recupero da Supabase:", error);
    return defaultSettings();
  }
}

export async function updateDunningSettings(next: DunningSettings): Promise<DunningSettings> {
  const { data, error } = await supabaseAdmin
    .from("dunning_settings")
    .upsert(
      {
        id: SETTINGS_ID,
        channel_whatsapp: next.channels.whatsapp,
        channel_sms: next.channels.sms,
        channel_email: next.channels.email,
        timing_step1_minutes: next.timing.step1,
        timing_step2_minutes: next.timing.step2,
        timing_step3_minutes: next.timing.step3,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select(
      "channel_whatsapp, channel_sms, channel_email, timing_step1_minutes, timing_step2_minutes, timing_step3_minutes"
    )
    .single();

  if (error) {
    throw new Error(`Errore nel salvataggio delle impostazioni dunning su Supabase: ${error.message}`);
  }

  return mapRow(data);
}
