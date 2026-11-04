-- Riallineamento del database live allo schema atteso dal codice.
--
-- Contesto: su Supabase live 20260920120000 risultava applicata solo in parte
-- (webhook_events creata a mano con uno schema diverso, niente
-- retry_bypassed, niente funzione connect_stripe_account) e 20261001120000
-- non era mai stata applicata. Effetti:
--   * "Connetti Stripe" falliva sempre nel callback OAuth
--     (src/lib/connected-stripe-accounts.ts chiama
--     rpc("connect_stripe_account"), inesistente);
--   * recordFailedPayment scriveva retry_bypassed (colonna inesistente), quindi
--     ogni webhook di pagamento fallito andava in errore;
--   * il cron smart-retry leggeva colonne inesistenti;
--   * claim_webhook_event (creata a mano, non usata dal codice) era
--     eseguibile da chiunque con la chiave pubblica anon.
-- Tutto è scritto in forma idempotente: si può rieseguire senza danni.

-- === failed_transactions: colonne mancanti ===
alter table public.failed_transactions
  add column if not exists error_category text,
  add column if not exists next_retry_at timestamptz,
  add column if not exists retry_bypassed boolean not null default false,
  add column if not exists charge_retry_count integer not null default 0
    check (charge_retry_count >= 0),
  add column if not exists next_charge_retry_at timestamptz;

create index if not exists failed_transactions_next_retry_at_idx
  on public.failed_transactions (next_retry_at)
  where next_retry_at is not null;

create index if not exists failed_transactions_next_charge_retry_at_idx
  on public.failed_transactions (next_charge_retry_at)
  where next_charge_retry_at is not null;

-- === webhook_events: vincolo di idempotenza ===
-- event_type può essere null lato applicazione (src/lib/webhook-idempotency.ts):
-- con NOT NULL l'insert falliva e il claim "fail-open" rielaborava i duplicati.
alter table public.webhook_events alter column event_type drop not null;

-- Rimuove eventuali duplicati prima di creare l'indice unico.
delete from public.webhook_events a
  using public.webhook_events b
  where a.provider = b.provider
    and a.event_id = b.event_id
    and a.ctid > b.ctid;

create unique index if not exists webhook_events_provider_event_id_idx
  on public.webhook_events (provider, event_id);

alter table public.webhook_events enable row level security;

-- === claim_webhook_event: non usata dal codice, esposta ad anon ===
do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'claim_webhook_event'
  loop
    execute format('drop function %s', fn);
  end loop;
end;
$$;

-- === connect_stripe_account: scrittura atomica del callback OAuth ===
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

-- Ricarica la cache dello schema di PostgREST (nuova funzione e colonne).
notify pgrst, 'reload schema';
