-- Chiavi API (Stripe, Resend, Twilio) inserite da /dashboard/impostazioni,
-- lette a runtime da src/lib/stripe.ts, src/lib/stripe-client.ts e
-- src/lib/email.ts (con fallback alle variabili d'ambiente se una chiave non
-- è stata salvata) così un aggiornamento dalla dashboard ha effetto immediato
-- senza toccare i file .env né rideployare.
--
-- Tabella singleton, stessa postura di public.merchant_settings: RecoverPulse
-- è a singolo merchant per deploy, un'unica riga identificata dall'id fisso
-- usato in src/lib/integration-settings.ts. RLS abilitata senza policy
-- anon/authenticated: accesso solo via service role lato server. Le chiavi
-- sono salvate in chiaro (stessa fiducia riposta nell'infrastruttura Postgres
-- gestita da Supabase delle altre tabelle) — una cifratura applicativa a
-- livello di colonna resta un miglioramento per una produzione più esigente.

create table if not exists public.integration_settings (
  id uuid primary key,
  stripe_publishable_key text not null default '',
  stripe_secret_key text not null default '',
  resend_api_key text not null default '',
  twilio_account_sid text not null default '',
  twilio_auth_token text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.integration_settings enable row level security;

grant select, insert, update, delete on public.integration_settings to service_role;
