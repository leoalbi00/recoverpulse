import "server-only";
import crypto from "node:crypto";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type AuthTokenPurpose = "password_reset" | "magic_link";

export type AuthToken = {
  id: string;
  userId: string;
  purpose: AuthTokenPurpose;
};

const TTL_MS: Record<AuthTokenPurpose, number> = {
  password_reset: 60 * 60 * 1000, // 1 ora
  magic_link: 15 * 60 * 1000, // 15 minuti: link di accesso, vita più breve del reset password
};

// Stesso principio di src/lib/tokens.ts: il token grezzo esiste solo nel
// link inviato via email, su Supabase salviamo esclusivamente il suo hash
// SHA-256.
function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function createAuthToken(userId: string, purpose: AuthTokenPurpose): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TTL_MS[purpose]).toISOString();

  const { error } = await supabaseAdmin.from("auth_tokens").insert({
    user_id: userId,
    purpose,
    token_hash: hashToken(rawToken),
    used: false,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Errore nella creazione del token di autenticazione su Supabase: ${error.message}`);
  }

  return rawToken;
}

export async function validateAuthToken(rawToken: string, purpose: AuthTokenPurpose): Promise<AuthToken | null> {
  const { data, error } = await supabaseAdmin
    .from("auth_tokens")
    .select("id, user_id, purpose")
    .eq("token_hash", hashToken(rawToken))
    .eq("purpose", purpose)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nella verifica del token di autenticazione su Supabase: ${error.message}`);
  }

  return data ? { id: data.id, userId: data.user_id, purpose: data.purpose } : null;
}

export async function markAuthTokenUsed(rawToken: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("auth_tokens")
    .update({ used: true })
    .eq("token_hash", hashToken(rawToken));

  if (error) {
    throw new Error(`Errore nell'invalidazione del token di autenticazione su Supabase: ${error.message}`);
  }
}
