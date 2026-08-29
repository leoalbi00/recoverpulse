import "server-only";

// Rate limiter in-memory, a finestra fissa, per proteggere gli endpoint pubblici
// più sensibili (login, registrazione, form pubblici) da brute force e spam.
// Stesso pattern "demo store" già usato in src/lib/dunning-settings.ts
// (persistenza in globalThis tra reload del dev server): è per-istanza, quindi
// su un deployment multi-istanza (es. Vercel con più regioni/funzioni) il limite
// reale è "N tentativi per istanza" e non un limite globale stretto — per un
// enforcement rigoroso su scala servirebbe uno store condiviso (es. Upstash
// Redis). Resta comunque un deterrente efficace contro brute force/spam
// automatizzato da un singolo IP.
type Bucket = { count: number; resetAt: number };

declare global {
  var __recoverpulseRateLimitBuckets: Map<string, Bucket> | undefined;
}

const buckets = globalThis.__recoverpulseRateLimitBuckets ?? new Map<string, Bucket>();
globalThis.__recoverpulseRateLimitBuckets = buckets;

const MAX_TRACKED_KEYS = 5000;

export type RateLimitResult = {
  allowed: boolean;
  /** Secondi da attendere prima del prossimo tentativo consentito. */
  retryAfterSeconds: number;
};

/**
 * Consente al massimo `limit` richieste ogni `windowSeconds` per `key`
 * (tipicamente `${route}:${ip}`). Da chiamare a inizio handler, prima di
 * qualunque operazione costosa (query DB, invio email, hashing password).
 */
export function checkRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();

  // Pulizia opportunistica: evita una crescita illimitata della mappa quando
  // molte chiavi diverse (IP diversi) scadono senza essere più lette.
  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Estrae l'IP client dagli header standard impostati dal proxy (Vercel/altri). */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
