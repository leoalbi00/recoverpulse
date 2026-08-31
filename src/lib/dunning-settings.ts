export type DunningChannel = "whatsapp" | "sms" | "email";

export type DunningStep = "step1" | "step2" | "step3";

export type DunningSettings = {
  channels: Record<DunningChannel, boolean>;
  /** Minuti di attesa dopo il pagamento fallito, per ciascun passaggio della sequenza. */
  timing: Record<DunningStep, number>;
};

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

declare global {
  var __recoverpulseDunningSettings: DunningSettings | undefined;
}

// In-memory demo store — sopravvive ai reload del dev server grazie a `globalThis`,
// ma va sostituito con un database vero prima della produzione.
const settings = globalThis.__recoverpulseDunningSettings ?? defaultSettings();
if (process.env.NODE_ENV !== "production") {
  globalThis.__recoverpulseDunningSettings = settings;
}

export function getDunningSettings(): DunningSettings {
  return settings;
}

export function updateDunningSettings(next: DunningSettings): DunningSettings {
  settings.channels = { ...next.channels };
  settings.timing = { ...next.timing };
  return settings;
}
