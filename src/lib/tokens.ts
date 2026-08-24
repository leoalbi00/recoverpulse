import "server-only";
import crypto from "node:crypto";

import { supabaseAdmin } from "@/lib/supabase-admin";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type PaymentToken = {
  id: string;
  userId: string | null;
  customerId: string;
};

// Il token grezzo (alta entropia, 256 bit) viene mostrato all'utente nel link del
// portale ed esiste solo in memoria/nell'URL: su Supabase salviamo esclusivamente
// il suo hash SHA-256, così un accesso in lettura al DB non permette di ricostruire
// token utilizzabili (stesso principio dei token di reset password).
function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Genera un token monouso per il portale di aggiornamento carta, valido 7 giorni,
 * e lo salva (hashato) sulla tabella `tokens`. Restituisce il token in chiaro da
 * inserire nel link `/pay/[token]` inviato al cliente.
 */
export async function createPaymentToken({
  customerId,
  userId = null,
}: {
  customerId: string;
  userId?: string | null;
}): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  const { error } = await supabaseAdmin.from("tokens").insert({
    user_id: userId,
    customer_id: customerId,
    token_hash: hashToken(rawToken),
    used: false,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Errore nella creazione del token di pagamento su Supabase: ${error.message}`);
  }

  return rawToken;
}

/**
 * Verifica un token del portale: deve esistere, non essere già stato usato e non
 * essere scaduto. Restituisce `null` se una qualsiasi di queste condizioni non è
 * soddisfatta (link non valido, già usato, o scaduto).
 */
export async function validatePaymentToken(rawToken: string): Promise<PaymentToken | null> {
  const { data, error } = await supabaseAdmin
    .from("tokens")
    .select("id, user_id, customer_id")
    .eq("token_hash", hashToken(rawToken))
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nella verifica del token di pagamento su Supabase: ${error.message}`);
  }

  if (!data) return null;

  return { id: data.id, userId: data.user_id, customerId: data.customer_id };
}

/** Segna il token come usato: rende impossibile un secondo utilizzo dello stesso link. */
export async function markPaymentTokenUsed(rawToken: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("tokens")
    .update({ used: true })
    .eq("token_hash", hashToken(rawToken));

  if (error) {
    throw new Error(`Errore nell'invalidazione del token di pagamento su Supabase: ${error.message}`);
  }
}
