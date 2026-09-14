import "server-only";
import crypto from "node:crypto";

import { supabaseAdmin } from "@/lib/supabase-admin";

// Prefisso riconoscibile (stile Stripe `sk_live_...`) così una chiave che
// finisce per errore in un log o in un repo pubblico è immediatamente
// identificabile come credenziale OmniRev.
const API_KEY_PREFIX = "rp_sdd_";

function generateApiKey(): string {
  return `${API_KEY_PREFIX}${crypto.randomBytes(24).toString("hex")}`;
}

/**
 * Legge la API Key del merchant collegato `userId`, se già generata. `null`
 * se non è mai stata creata (prima visita a /dashboard/impostazioni dopo
 * questa feature).
 */
export async function getMerchantApiKey(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("merchant_api_keys")
    .select("api_key")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nel recupero della API Key su Supabase: ${error.message}`);
  }

  return data?.api_key ?? null;
}

/**
 * Legge (o genera al primo accesso) la API Key del merchant collegato
 * `userId`: usata da /dashboard/impostazioni per mostrare sempre una chiave
 * pronta all'uso, senza richiedere un'azione esplicita di "genera" prima di
 * poter configurare il webhook SDD nel proprio gestionale.
 */
export async function getOrCreateMerchantApiKey(userId: string): Promise<string> {
  const existing = await getMerchantApiKey(userId);
  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from("merchant_api_keys")
    .upsert(
      { user_id: userId, api_key: generateApiKey(), updated_at: new Date().toISOString() },
      { onConflict: "user_id", ignoreDuplicates: true }
    )
    .select("api_key")
    .single();

  // ignoreDuplicates lascia `data` vuoto in caso di race (due richieste
  // concorrenti al primo caricamento della pagina): in quel caso la riga
  // esiste già, la rileggiamo invece di fallire.
  if (error || !data) {
    const fallback = await getMerchantApiKey(userId);
    if (fallback) return fallback;
    throw new Error(`Errore nella generazione della API Key su Supabase: ${error?.message ?? "riga non trovata"}`);
  }

  return data.api_key;
}

/** Rigenera la API Key del merchant, invalidando quella precedente (pulsante "Rigenera" in dashboard). */
export async function regenerateMerchantApiKey(userId: string): Promise<string> {
  const apiKey = generateApiKey();

  const { error } = await supabaseAdmin
    .from("merchant_api_keys")
    .upsert({ user_id: userId, api_key: apiKey, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  if (error) {
    throw new Error(`Errore nella rigenerazione della API Key su Supabase: ${error.message}`);
  }

  return apiKey;
}

/**
 * Risolve l'utente OmniRev proprietario di una API Key, usata dal
 * webhook universale SDD (/api/v1/webhooks/sdd) per autenticare le chiamate
 * in arrivo dai gestionali/CRM esterni.
 */
export async function getUserIdForApiKey(apiKey: string): Promise<string | null> {
  if (!apiKey) return null;

  const { data, error } = await supabaseAdmin
    .from("merchant_api_keys")
    .select("user_id")
    .eq("api_key", apiKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nella verifica della API Key su Supabase: ${error.message}`);
  }

  return data?.user_id ?? null;
}
