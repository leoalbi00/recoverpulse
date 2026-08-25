-- Tabella delle transazioni fallite (invoice.payment_failed), sostituisce lo
-- store in-memory di src/lib/transactions.ts: su Vercel ogni invocazione
-- serverless è un processo a sé, quindi i dati in memoria non sopravvivono
-- tra la richiesta del webhook Stripe e quella successiva del portale /pay.
--
-- Nota di sicurezza: stessa postura delle altre tabelle (vedi
-- 20260816120000_init_schema.sql) — RLS abilitata senza policy per
-- anon/authenticated, accesso solo tramite SUPABASE_SERVICE_ROLE_KEY lato server.

create table if not exists public.failed_transactions (
  id uuid primary key default gen_random_uuid(),
  invoice_id text not null unique,
  customer_id text not null,
  customer_name text not null,
  customer_email text not null,
  subscription_id text,
  plan_name text not null,
  amount integer not null,
  currency text not null,
  reason text not null,
  status text not null default 'in_corso' check (status in ('in_corso', 'recuperato', 'perso')),
  -- Token in chiaro del portale 1-click: riusato per rigenerare lo stesso link
  -- di recupero quando si reinvia un sollecito (vedi src/lib/dunning.ts). La
  -- verifica del token nel portale resta comunque quella hashata su
  -- public.tokens (src/lib/tokens.ts) — questo campo serve solo a ricostruire
  -- il link, non a validarlo.
  payment_link_token text not null,
  created_at timestamptz not null default now(),
  recovered_at timestamptz
);

create index if not exists failed_transactions_customer_id_idx on public.failed_transactions (customer_id);
create index if not exists failed_transactions_status_idx on public.failed_transactions (status);
create index if not exists failed_transactions_created_at_idx on public.failed_transactions (created_at desc);

alter table public.failed_transactions enable row level security;

grant select, insert, update, delete on public.failed_transactions to service_role;
