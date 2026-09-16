-- Collegamento 1-click SEPA Direct Debit via OAuth2 GoCardless Partner App
-- (src/lib/gocardless.ts, src/app/api/gocardless/connect/{authorize,callback}/route.ts),
-- alternativo al webhook universale generico già in produzione
-- (public.merchant_api_keys, 20260913120000_sdd_dunning.sql) per i merchant
-- che processano gli addebiti SEPA direttamente su GoCardless.
--
-- Stessa struttura di connected_stripe_accounts: una riga per organisation
-- GoCardless collegata, chiave primaria sull'organisation_id (non sull'utente)
-- così un'eventuale riconnessione da un altro utente OmniRev è gestita
-- esplicitamente dal callback invece che da un vincolo di unicità silenzioso.
-- access_token cifrato prima del salvataggio (src/lib/encryption.ts).

create table public.connected_gocardless_accounts (
  organisation_id text primary key,
  user_id uuid not null unique references public.users (id) on delete cascade,
  access_token text not null,
  organisation_name text,
  environment text not null default 'live' check (environment in ('live', 'sandbox')),
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists connected_gocardless_accounts_user_id_idx
  on public.connected_gocardless_accounts (user_id);

alter table public.connected_gocardless_accounts enable row level security;
grant select, insert, update, delete on public.connected_gocardless_accounts to service_role;
