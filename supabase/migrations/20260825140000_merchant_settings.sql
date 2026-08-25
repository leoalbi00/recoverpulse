-- Impostazioni di brand del merchant (nome azienda, email di supporto, logo,
-- colore primario), lette dinamicamente dal template email di dunning
-- (src/lib/email.ts) e dal portale /pay/[token] per personalizzare
-- l'esperienza con il brand del cliente invece del solo brand RecoverPulse.
--
-- Tabella singleton: RecoverPulse qui è un'app a singolo merchant (un solo
-- account Stripe/Resend per deploy, vedi src/lib/dunning-settings.ts e
-- src/lib/integration-settings.ts, entrambe globali e non per-utente), quindi
-- esiste una sola riga identificata dall'id fisso usato in
-- src/lib/merchant-settings.ts. Niente RLS con policy anon/authenticated:
-- stessa postura delle altre tabelle, accesso solo via service role lato server.

create table if not exists public.merchant_settings (
  id uuid primary key,
  company_name text not null default 'RecoverPulse',
  support_email text not null default '',
  logo_url text,
  primary_color text not null default '#10b981',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.merchant_settings enable row level security;

grant select, insert, update, delete on public.merchant_settings to service_role;
