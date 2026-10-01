-- FASE 1 (hardening webhook) + FASE 2 (smart retry/error categorization) del
-- piano di rifinitura OmniRev: vedi il report finale in conversazione per il
-- contesto completo.

-- === Idempotenza webhook ===
-- Un solo registro per (provider, event_id): l'INSERT con onConflict "do
-- nothing" lato applicazione (src/lib/webhook-idempotency.ts) è l'unica fonte
-- di verità su "questo evento è già stato elaborato", indipendente dalla
-- semantica di upsert di ogni singola tabella a valle (che di per sé non
-- impedisce di rieseguire gli effetti collaterali: invio email, avvio
-- dunning). Stessa postura RLS delle altre tabelle applicative: nessuna
-- policy anon/authenticated, accesso solo via service role
-- (src/lib/supabase-admin.ts).
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe', 'paypal', 'gocardless')),
  event_id text not null,
  event_type text,
  received_at timestamptz not null default now()
);

create unique index if not exists webhook_events_provider_event_id_idx
  on public.webhook_events (provider, event_id);

alter table public.webhook_events enable row level security;
grant select, insert on public.webhook_events to service_role;

-- === Smart Retry & Error Categorization ===
-- error_category: risultato della classificazione del motivo di rifiuto
-- gateway (src/lib/dunning-error-categorization.ts) — 'insufficient_funds',
-- 'expired_card', 'invalid_card', 'bank_system_error' o 'other'.
-- next_retry_at: quando impostato, il cron di dunning
-- (src/app/api/cron/dunning/route.ts) lo tratta come override del prossimo
-- tentativo automatico invece del normale step T+giorni del template.
-- retry_bypassed: true per expired_card/invalid_card — niente ulteriori
-- solleciti automatici a giorni fissi (il cliente ha già ricevuto subito il
-- Magic Link per aggiornare il metodo, via startDunningSequence).
alter table public.failed_transactions
  add column if not exists error_category text
    check (error_category in ('insufficient_funds', 'expired_card', 'invalid_card', 'bank_system_error', 'other')),
  add column if not exists next_retry_at timestamptz,
  add column if not exists retry_bypassed boolean not null default false;

create index if not exists failed_transactions_next_retry_at_idx
  on public.failed_transactions (next_retry_at)
  where next_retry_at is not null;

-- === Atomicità dello scambio OAuth Stripe Connect ===
-- src/app/api/stripe/connect/callback/route.ts eseguiva due scritture
-- separate (upsert su connected_stripe_accounts, poi update su
-- users.stripe_account_id): un errore di rete tra le due lasciava
-- connected_stripe_accounts popolata ma l'utente senza l'account collegato
-- (o viceversa dopo il trasferimento di proprietà). Questa funzione esegue
-- entrambe le scritture nella stessa transazione Postgres, chiamata via
-- supabase.rpc() da src/lib/connected-stripe-accounts.ts.
create or replace function public.connect_stripe_account(
  p_stripe_account_id text,
  p_user_id uuid,
  p_access_token text,
  p_refresh_token text,
  p_publishable_key text,
  p_scope text,
  p_livemode boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.connected_stripe_accounts (
    stripe_account_id, user_id, access_token, refresh_token, publishable_key, scope, livemode, updated_at
  ) values (
    p_stripe_account_id, p_user_id, p_access_token, p_refresh_token, p_publishable_key, p_scope, p_livemode, now()
  )
  on conflict (stripe_account_id) do update set
    user_id = excluded.user_id,
    access_token = excluded.access_token,
    refresh_token = excluded.refresh_token,
    publishable_key = excluded.publishable_key,
    scope = excluded.scope,
    livemode = excluded.livemode,
    updated_at = now();

  update public.users set stripe_account_id = p_stripe_account_id where id = p_user_id;
end;
$$;

revoke all on function public.connect_stripe_account(text, uuid, text, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.connect_stripe_account(text, uuid, text, text, text, text, boolean) to service_role;
