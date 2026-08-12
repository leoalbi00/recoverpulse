export type IntegrationSettings = {
  stripeSecretKey: string;
  resendApiKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
};

function defaultSettings(): IntegrationSettings {
  return {
    stripeSecretKey: "",
    resendApiKey: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
  };
}

declare global {
  var __recoverpulseIntegrationSettings: IntegrationSettings | undefined;
}

// In-memory demo store — sopravvive ai reload del dev server grazie a `globalThis`,
// ma va sostituito con un database vero (con cifratura a riposo per i secret)
// prima della produzione.
const settings = globalThis.__recoverpulseIntegrationSettings ?? defaultSettings();
if (process.env.NODE_ENV !== "production") {
  globalThis.__recoverpulseIntegrationSettings = settings;
}

export function getIntegrationSettings(): IntegrationSettings {
  return settings;
}

export function updateIntegrationSettings(
  next: Partial<IntegrationSettings>
): IntegrationSettings {
  Object.assign(settings, next);
  return settings;
}

/** Mostra solo le ultime 4 cifre di un secret, per conferma visiva senza esporlo. */
export function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "•".repeat(value.length);
  return `${"•".repeat(value.length - 4)}${value.slice(-4)}`;
}
