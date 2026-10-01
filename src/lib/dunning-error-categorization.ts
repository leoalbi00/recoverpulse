// Smart Retry & Error Categorization Engine (FASE 2 del piano di rifinitura):
// classifica il motivo di rifiuto riportato dal gateway in una categoria
// azionabile, usata dal webhook (per calcolare `next_retry_at`/`retry_bypassed`
// al momento della registrazione dell'insoluto, src/lib/transactions.ts) e dal
// cron di dunning (per decidere se e quando forzare un tentativo, vedi
// src/app/api/cron/dunning/route.ts).
//
// Nessuna dipendenza da Supabase o da un gateway specifico: riceve solo i
// codici/messaggi grezzi già estratti da ciascun webhook (Stripe decline
// code, GoCardless `details.cause`, codice di storno SEPA) così resta
// testabile e riusabile da tutti e tre.

export type ErrorCategory = "insufficient_funds" | "expired_card" | "invalid_card" | "bank_system_error" | "other";

const INSUFFICIENT_FUNDS_CODES = new Set([
  "insufficient_funds",
  "insufficient_funds_ivr", // Stripe
  "amount_exceeds_resource_limit",
  "am04", // SEPA: fondi insufficienti
]);

const EXPIRED_CARD_CODES = new Set(["expired_card"]);

const INVALID_CARD_CODES = new Set([
  "invalid_card",
  "invalid_card_type",
  "invalid_cvc",
  "invalid_expiry_month",
  "invalid_expiry_year",
  "incorrect_cvc",
  "incorrect_number",
  "card_declined",
  "do_not_honor",
  "generic_decline",
  "lost_card",
  "stolen_card",
  "pickup_card",
  "restricted_card",
  "revocation_of_authorization",
  "invalid_bank_details", // GoCardless: IBAN/dati bancari non validi
  "mandate_cancelled", // GoCardless: mandato SEPA revocato dal cliente
  "mandate_expired",
  "bank_account_closed", // GoCardless
  "ac01", // SEPA: IBAN errato
  "ac04", // SEPA: conto chiuso
  "ac06", // SEPA: conto bloccato
  "md01", // SEPA: mandato mancante/non valido
  "md07", // SEPA: debitore deceduto
  "ms02", // SEPA: rifiutato dal debitore
]);

const BANK_SYSTEM_ERROR_CODES = new Set([
  "processing_error",
  "issuer_not_available",
  "try_again_later",
  "reenter_transaction",
  "bank_system_error", // GoCardless
  "not_enough_headroom", // GoCardless: limite di prelievo mandato temporaneo
  "ms03", // SEPA: errore tecnico banca
  "ms06",
]);

/** Normalizza un codice gateway (Stripe/GoCardless/SEPA) per il confronto: minuscolo, senza spazi. */
function normalize(code: string | null | undefined): string | null {
  if (!code) return null;
  return code.trim().toLowerCase();
}

/**
 * Categorizza un errore di pagamento a partire dal/i codice/i grezzo/i del
 * gateway. Prova prima i codici più specifici (fondi insufficienti, carta
 * scaduta) poi quelli generici; ricade su `message` solo se nessun codice
 * strutturato è disponibile (tipico di alcuni eventi Stripe di test/CLI).
 */
export function categorizeGatewayError(input: { code?: string | null; declineCode?: string | null; message?: string | null }): ErrorCategory {
  const candidates = [normalize(input.code), normalize(input.declineCode)].filter(
    (value): value is string => value !== null
  );

  for (const candidate of candidates) {
    if (EXPIRED_CARD_CODES.has(candidate)) return "expired_card";
    if (INSUFFICIENT_FUNDS_CODES.has(candidate)) return "insufficient_funds";
    if (INVALID_CARD_CODES.has(candidate)) return "invalid_card";
    if (BANK_SYSTEM_ERROR_CODES.has(candidate)) return "bank_system_error";
  }

  const message = normalize(input.message);
  if (message) {
    if (message.includes("scadut") || message.includes("expired")) return "expired_card";
    if (message.includes("fondi") || message.includes("insufficient")) return "insufficient_funds";
  }

  return "other";
}

/** True per le categorie dove non ha senso ritentare l'addebito senza un'azione del cliente: si passa subito al Magic Link, niente ulteriori solleciti a giorni fissi. */
export function isRetryBypassCategory(category: ErrorCategory): boolean {
  return category === "expired_card" || category === "invalid_card";
}

/**
 * Prossima data di tentativo "intelligente" per le categorie che lo
 * richiedono, `null` per le altre (expired_card/invalid_card non ritentano
 * automaticamente; "other" segue il normale calendario a step del template).
 *
 * - insufficient_funds: il 1° o il 15° del mese, i giorni tipici di
 *   accredito stipendio/pensione in Italia — qualunque sia più vicino nel
 *   futuro rispetto a `now`.
 * - bank_system_error: errore tecnico temporaneo lato banca/gateway, ritenta
 *   entro 24-48h (fissato a 36h, il punto medio della finestra richiesta).
 */
export function computeNextRetryAt(category: ErrorCategory, now: Date = new Date()): Date | null {
  if (category === "insufficient_funds") {
    return nextSalaryDay(now);
  }

  if (category === "bank_system_error") {
    return new Date(now.getTime() + 36 * 60 * 60 * 1000);
  }

  return null;
}

function nextSalaryDay(now: Date): Date {
  const year = now.getFullYear();
  const month = now.getMonth();

  const first = new Date(year, month, 1, 9, 0, 0, 0);
  const fifteenth = new Date(year, month, 15, 9, 0, 0, 0);
  const nextFirst = new Date(year, month + 1, 1, 9, 0, 0, 0);

  if (now.getTime() < first.getTime()) return first;
  if (now.getTime() < fifteenth.getTime()) return fifteenth;
  return nextFirst;
}
