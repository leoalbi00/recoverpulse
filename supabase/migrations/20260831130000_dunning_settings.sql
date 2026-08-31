-- Canali attivi e tempi di attesa della sequenza dunning, configurati da
-- /dashboard/sequenze (src/lib/dunning-settings.ts). Prima viveva solo in
-- memoria (globalThis), quindi ogni cold start/nuova istanza serverless su
-- Vercel perdeva le modifiche salvate dalla dashboard: spostata su Supabase
-- perché letta a runtime dal webhook Stripe (src/lib/dunning.ts) a ogni
-- pagamento fallito.
--
-- Tabella singleton, stessa postura di public.merchant_settings e
-- public.integration_settings: un'unica riga identificata dall'id fisso
-- usato in src/lib/dunning-settings.ts. RLS abilitata senza policy
-- anon/authenticated: accesso solo via service role lato server.
--
-- channel_whatsapp/channel_sms di default false: nessuna integrazione
-- Twilio/WhatsApp Business API è ancora implementata (vedi
-- src/lib/dunning.ts), i relativi toggle in dashboard sono disabilitati.

create table if not exists public.dunning_settings (
  id uuid primary key,
  channel_whatsapp boolean not null default false,
  channel_sms boolean not null default false,
  channel_email boolean not null default true,
  timing_step1_minutes integer not null default 5,
  timing_step2_minutes integer not null default 720,
  timing_step3_minutes integer not null default 1440,
  updated_at timestamptz not null default now()
);

alter table public.dunning_settings enable row level security;

grant select, insert, update, delete on public.dunning_settings to service_role;

insert into public.dunning_settings (id)
values ('00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;
