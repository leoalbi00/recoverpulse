import "server-only";

// I link inviati via email devono sempre puntare al dominio di produzione,
// indipendentemente dall'ambiente in cui gira il job (webhook, cron, anche in locale).
export function getAppBaseUrl(): string {
  return "https://recoverpulse-three.vercel.app";
}
