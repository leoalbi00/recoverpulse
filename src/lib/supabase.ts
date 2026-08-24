import { createClient } from "@supabase/supabase-js";

// Fallback a un URL sintatticamente valido se la variabile manca: evita che
// `createClient` lanci un errore già all'import del modulo (es. in build/dev
// senza .env configurato) — le chiamate reali falliranno comunque a runtime
// con un errore di rete chiaro, stesso approccio usato in src/lib/stripe.ts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Client pubblico (chiave anon, soggetta a Row Level Security): sicuro da
// importare anche in componenti client. Le tabelle applicative (users, tokens,
// dunning_logs) hanno RLS abilitata senza policy per anon/authenticated, quindi
// con questo client quelle tabelle risultano illeggibili/non scrivibili — per le
// scritture privilegiate lato server usa `supabaseAdmin` da "@/lib/supabase-admin".
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
