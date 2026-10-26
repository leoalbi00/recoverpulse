import "server-only";
import crypto from "node:crypto";

/**
 * Verifica l'header `Authorization: Bearer <CRON_SECRET>` inviato da Vercel
 * Cron (src/app/api/cron/*). Confronto a tempo costante sugli hash SHA-256
 * (stessa lunghezza garantita): un `===` diretto rivelerebbe via timing
 * quanti caratteri del secret sono già corretti. Nessun CRON_SECRET
 * configurato = accesso negato (fail closed).
 */
export function isCronAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const provided = request.headers.get("authorization") ?? "";
  const providedHash = crypto.createHash("sha256").update(provided).digest();
  const expectedHash = crypto.createHash("sha256").update(`Bearer ${cronSecret}`).digest();
  return crypto.timingSafeEqual(providedHash, expectedHash);
}
