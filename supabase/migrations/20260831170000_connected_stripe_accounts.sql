-- Stripe Standard Connect: un merchant collega il proprio account Stripe via
-- OAuth invece di incollare le chiavi API a mano
-- (src/app/api/stripe/connect/*, sostituisce l'inserimento manuale in
-- src/components/dashboard/integration-keys-panel.tsx).
--
-- Una riga per Stripe account collegato, mai per utente RecoverPulse: questo
-- è intenzionale. trial_started_at NON viene mai sovrascritto dagli upsert
-- successivi (né qui né in src/lib/connected-stripe-accounts.ts, che omette
-- deliberatamente questa colonna dal payload di upsert): i 14 giorni di prova
-- sono legati allo Stripe account, non all'account RecoverPulse che lo ha
-- collegato, così ri-registrarsi con una nuova email e ricollegare lo stesso
-- account Stripe non resetta la prova. La riga non viene mai cancellata alla
-- disconnessione (src/app/api/stripe/connect/route.ts DELETE pulisce solo
-- users.stripe_account_id).
--
-- access_token per gli Standard account è di per sé equivalente a una secret
-- key con scope sull'account collegato ("Use it as you would any Stripe
-- secret API key", vedi node_modules/stripe/.../OAuth.d.ts): new
-- Stripe(access_token) opera già come quell'account, nessuna { stripeAccount }
-- request option necessaria.
--
-- RLS abilitata senza policy anon/authenticated, stessa postura delle altre
-- tabelle applicative: accesso solo via service role lato server
-- (src/lib/supabase-admin.ts).
create table if not exists public.connected_stripe_accounts (
  stripe_account_id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  access_token text not null,
  refresh_token text,
  publishable_key text,
  scope text,
  livemode boolean not null default false,
  trial_started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists connected_stripe_accounts_user_id_idx on public.connected_stripe_accounts (user_id);

alter table public.connected_stripe_accounts enable row level security;
grant select, insert, update, delete on public.connected_stripe_accounts to service_role;

-- Un utente RecoverPulse ha al più un account Stripe collegato alla volta.
alter table public.users
  add column if not exists stripe_account_id text
    references public.connected_stripe_accounts (stripe_account_id);

alter table public.users
  add constraint users_stripe_account_id_unique unique (stripe_account_id);

-- === Scoping per-utente delle tabelle finora condivise da tutti i login ===
-- Backfill: tutte le righe esistenti vengono assegnate al primo utente
-- registrato, prima di rendere la colonna NOT NULL. Decisione di dati di
-- produzione confermata esplicitamente prima di applicare questa migration
-- (vedi /home/codespace/.claude/plans/rippling-waddling-hollerith.md).
do $$
declare
  fallback_user_id uuid;
begin
  select id into fallback_user_id from public.users order by created_at asc limit 1;

  if fallback_user_id is not null then
    alter table public.failed_transactions add column if not exists user_id uuid references public.users (id) on delete cascade;
    update public.failed_transactions set user_id = fallback_user_id where user_id is null;

    alter table public.notifications add column if not exists user_id uuid references public.users (id) on delete cascade;
    update public.notifications set user_id = fallback_user_id where user_id is null;

    -- merchant_settings: singleton -> per-utente (id fisso resta come PK
    -- storica, l'applicazione passa a onConflict "user_id").
    alter table public.merchant_settings add column if not exists user_id uuid references public.users (id) on delete cascade;
    update public.merchant_settings set user_id = fallback_user_id where user_id is null;

    alter table public.dunning_settings add column if not exists user_id uuid references public.users (id) on delete cascade;
    update public.dunning_settings set user_id = fallback_user_id where user_id is null;

    alter table public.dunning_template_settings add column if not exists user_id uuid references public.users (id) on delete cascade;
    update public.dunning_template_settings set user_id = fallback_user_id where user_id is null;

    alter table public.dunning_template_steps add column if not exists user_id uuid references public.users (id) on delete cascade;
    update public.dunning_template_steps set user_id = fallback_user_id where user_id is null;

    -- dunning_logs.user_id esiste già (nullable, mai popolata finora) — la
    -- backfilliamo ma resta nullable in questa migration (vedi nota sotto).
    update public.dunning_logs set user_id = fallback_user_id where user_id is null;
  end if;
end $$;

alter table public.failed_transactions alter column user_id set not null;
alter table public.notifications alter column user_id set not null;
alter table public.merchant_settings alter column user_id set not null;
alter table public.dunning_settings alter column user_id set not null;
alter table public.dunning_template_settings alter column user_id set not null;
alter table public.dunning_template_steps alter column user_id set not null;
-- dunning_logs.user_id resta nullable in questa migration: il cron per-account
-- (src/app/api/cron/dunning/route.ts) inizia a popolarla da ora in poi, ma le
-- righe storiche restano orfane finché non si verifica in produzione che il
-- nuovo loop scrive correttamente — si stringe a NOT NULL in un follow-up.

create index if not exists failed_transactions_user_id_idx on public.failed_transactions (user_id);
create index if not exists notifications_user_id_idx on public.notifications (user_id);

-- merchant_settings / dunning_settings / dunning_template_settings passano da
-- una riga singleton globale a una riga per utente: serve un vincolo unique
-- perché l'applicazione fa upsert con onConflict "user_id".
alter table public.merchant_settings add constraint merchant_settings_user_id_unique unique (user_id);
alter table public.dunning_settings add constraint dunning_settings_user_id_unique unique (user_id);
alter table public.dunning_template_settings add constraint dunning_template_settings_user_id_unique unique (user_id);

-- La colonna `id` di queste 3 tabelle era la PK del vecchio singleton (uuid
-- fisso per merchant_settings, testo letterale 'default' per le altre due),
-- senza default adatto a righe multiple: l'applicazione ora fa upsert senza
-- specificare `id` (onConflict è su "user_id"), quindi ogni inserimento
-- successivo al primo fallirebbe (id NOT NULL senza default) o collidirebbe
-- sulla PK (default letterale 'default' identico per ogni utente). Un
-- default che genera un valore diverso a ogni riga risolve entrambi i casi
-- senza dover toccare la PK esistente.
alter table public.merchant_settings alter column id set default gen_random_uuid();
alter table public.dunning_settings alter column id set default gen_random_uuid()::text;
alter table public.dunning_template_settings alter column id set default gen_random_uuid()::text;

-- dunning_template_steps: la chiave cambia da step_id (globale) a
-- (user_id, step_id) — ogni utente ha ora le sue 3 righe di step.
alter table public.dunning_template_steps drop constraint if exists dunning_template_steps_pkey;
alter table public.dunning_template_steps add constraint dunning_template_steps_pkey primary key (user_id, step_id);
