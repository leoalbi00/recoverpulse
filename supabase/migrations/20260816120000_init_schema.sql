-- Schema iniziale RecoverPulse: utenti applicativi, token del portale 1-click
-- di aggiornamento carta, e log degli invii delle sequenze di dunning.
--
-- Nota di sicurezza: RLS è abilitata su tutte e tre le tabelle e non vengono
-- definite policy per i ruoli `anon`/`authenticated`. Questo significa che solo
-- il client con la SUPABASE_SERVICE_ROLE_KEY (usato esclusivamente lato server,
-- vedi src/lib/supabase-admin.ts) può leggere o scrivere questi dati: la chiave
-- anon pubblica (NEXT_PUBLIC_SUPABASE_ANON_KEY), esposta al browser, non ha
-- alcun accesso diretto a password_hash o agli altri dati sensibili.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);

alter table public.users enable row level security;

create table if not exists public.tokens (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: i token vengono generati dal webhook Stripe (invoice.payment_failed),
  -- che non ha modo di risalire in modo affidabile all'utente RecoverPulse
  -- proprietario della fattura fallita senza Stripe Connect. `customer_id` (Stripe
  -- Customer ID del cliente finale a cui va chiesto l'aggiornamento carta) resta
  -- invece obbligatorio: è la chiave usata per risolvere il token nel portale.
  user_id uuid references public.users (id) on delete cascade,
  customer_id text not null,
  token_hash text not null unique,
  used boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists tokens_user_id_idx on public.tokens (user_id);
create index if not exists tokens_customer_id_idx on public.tokens (customer_id);

alter table public.tokens enable row level security;

create table if not exists public.dunning_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  customer_email text not null,
  channel text not null check (channel in ('whatsapp', 'sms', 'email')),
  status text not null check (status in ('sent', 'failed')),
  sent_at timestamptz not null default now()
);

create index if not exists dunning_logs_user_id_idx on public.dunning_logs (user_id);
create index if not exists dunning_logs_sent_at_idx on public.dunning_logs (sent_at desc);

alter table public.dunning_logs enable row level security;

-- Grant esplicito a `service_role`: il bypass della RLS non concede di per sé i
-- privilegi SQL (SELECT/INSERT/UPDATE/DELETE) sulle tabelle. Senza questi grant
-- le query di src/lib/supabase-admin.ts falliscono con "permission denied",
-- perché i privilegi di default per le tabelle create dal ruolo `postgres` (usato
-- dalle migration) non includono automaticamente `service_role`.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.users, public.tokens, public.dunning_logs to service_role;
