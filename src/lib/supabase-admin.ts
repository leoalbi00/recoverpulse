import "server-only";

import { createClient } from "@supabase/supabase-js";

// Fallback a valori sintatticamente validi se le variabili mancano: evita che
// `createClient` lanci un errore già all'import del modulo (es. in build/dev
// senza .env configurato) — le chiamate reali falliranno comunque a runtime
// con un errore di rete chiaro, stesso approccio usato in src/lib/stripe.ts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

// Client privilegiato (service role, bypassa la RLS): riservato a codice
// server-only (Route Handler, Server Component, `authorize()` di NextAuth).
// L'import di "server-only" fa fallire la build se questo file finisce nel
// bundle client, evitando che la service role key trapeli al browser.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
