import "server-only";
import crypto from "node:crypto";

import { supabaseAdmin } from "@/lib/supabase-admin";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minuti
// Include le due verifiche corrette del flusso (Step 2 e Step 3).
const MAX_ATTEMPTS = 7;

export type PendingTrialSignup = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type TrialSignupRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  otp_hash: string;
  attempts: number;
  expires_at: string;
};

export type VerifyOtpFailureReason = "not_found" | "expired" | "too_many_attempts" | "invalid";

export type VerifyOtpResult = { ok: true } | { ok: false; reason: VerifyOtpFailureReason };

// Stesso principio di src/lib/auth-tokens.ts: mai il codice in chiaro su
// Supabase, solo il suo hash SHA-256.
function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Avvia (o riavvia, se già in corso per la stessa email) una registrazione
 * self-serve: salva i dati dello Step 1 e genera un nuovo codice OTP a 6
 * cifre, ritornato in chiaro solo qui perché il chiamante lo invii via
 * email — non viene mai persistito su Supabase in chiaro. L'upsert su
 * `email` sovrascrive un'eventuale richiesta precedente non completata
 * (es. l'utente non ha ricevuto il codice e riprova dallo Step 1).
 */
export async function startTrialSignup(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<string> {
  const email = input.email.toLowerCase();
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error } = await supabaseAdmin.from("trial_signups").upsert(
    {
      email,
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
      otp_hash: hashOtp(code),
      attempts: 0,
      expires_at: expiresAt,
    },
    { onConflict: "email" }
  );

  if (error) {
    throw new Error(`Errore nella creazione della richiesta di attivazione su Supabase: ${error.message}`);
  }

  return code;
}

/**
 * Verifica il codice OTP per `email` senza consumarlo: chiamata sia da
 * /api/trial-signup/verify-otp (solo per sbloccare lo step Password nella
 * UI) sia, una seconda volta, da /api/trial-signup/complete (che ri-valida
 * prima di creare l'account — vedi commento lì). Ogni chiamata consuma un
 * tentativo (MAX_ATTEMPTS tiene conto delle due verifiche corrette), per
 * bloccare il brute force sullo spazio ridotto di un OTP a 6 cifre.
 */
export async function verifyTrialSignupOtp(email: string, code: string): Promise<VerifyOtpResult> {
  const normalizedEmail = email.toLowerCase();

  const { data, error } = await supabaseAdmin
    .from("trial_signups")
    .select("id, otp_hash, attempts, expires_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nella verifica del codice di attivazione su Supabase: ${error.message}`);
  }

  if (!data) return { ok: false, reason: "not_found" };
  if (new Date(data.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (data.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts" };

  // Ogni verifica (anche corretta) consuma un tentativo con un'UPDATE
  // condizionata al valore appena letto: N richieste parallele non possono
  // più leggere tutte lo stesso `attempts` e provare N codici diversi
  // oltre il limite. Chi perde la corsa conta come tentativo non valido.
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("trial_signups")
    .update({ attempts: data.attempts + 1 })
    .eq("id", data.id)
    .eq("attempts", data.attempts)
    .select("id")
    .maybeSingle();
  if (claimError) {
    throw new Error(`Errore nella registrazione del tentativo su Supabase: ${claimError.message}`);
  }
  if (!claimed) return { ok: false, reason: "invalid" };

  // Confronto a tempo costante: stesso principio di isValidInviteCode in
  // src/app/api/register/route.ts. I due hash SHA-256 hanno sempre la
  // stessa lunghezza (64 caratteri hex), quindi il confronto di lunghezza
  // qui non introduce comunque una differenza di timing osservabile.
  const providedHash = Buffer.from(hashOtp(code));
  const expectedHash = Buffer.from(data.otp_hash);
  const isValid = providedHash.length === expectedHash.length && crypto.timingSafeEqual(providedHash, expectedHash);

  if (!isValid) return { ok: false, reason: "invalid" };

  return { ok: true };
}

export async function getPendingTrialSignup(email: string): Promise<PendingTrialSignup | null> {
  const { data, error } = await supabaseAdmin
    .from("trial_signups")
    .select("first_name, last_name, email, phone")
    .eq("email", email.toLowerCase())
    .maybeSingle<Pick<TrialSignupRow, "first_name" | "last_name" | "email" | "phone">>();

  if (error) {
    throw new Error(`Errore nel recupero della registrazione in corso da Supabase: ${error.message}`);
  }

  return data
    ? { firstName: data.first_name, lastName: data.last_name, email: data.email, phone: data.phone }
    : null;
}

/** Pulizia post-completamento: evita che il codice OTP consumato resti riutilizzabile per un nuovo tentativo di /complete. */
export async function deleteTrialSignup(email: string): Promise<void> {
  const { error } = await supabaseAdmin.from("trial_signups").delete().eq("email", email.toLowerCase());
  if (error) {
    console.error("[trial-signup] errore nella pulizia della registrazione completata su Supabase:", error.message);
  }
}
