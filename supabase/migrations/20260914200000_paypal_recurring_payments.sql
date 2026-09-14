-- Estende il motore di recupero pagamenti falliti per includere PayPal
-- Subscriptions come terzo gateway, accanto a Stripe (card) e al webhook
-- universale SDD/SEPA (sepa_debit) già in produzione (vedi
-- 20260913120000_sdd_dunning.sql). Un abbonato PayPal ha un
-- paypal_subscription_id (non un Invoice/Customer Stripe) e un
-- gateway_customer_id (il Payer ID PayPal), da cui src/lib/transactions.ts
-- costruisce customer_id/invoice_id sintetici con lo stesso schema già usato
-- per gli insoluti SDD (prefisso "paypal:"/"paypal_").

alter table public.failed_transactions
  drop constraint if exists failed_transactions_payment_method_type_check;
alter table public.failed_transactions
  add constraint failed_transactions_payment_method_type_check
    check (payment_method_type in ('card', 'sepa_debit', 'paypal'));

alter table public.failed_transactions
  add column if not exists paypal_subscription_id text,
  add column if not exists gateway_customer_id text;

create index if not exists failed_transactions_paypal_subscription_id_idx
  on public.failed_transactions (paypal_subscription_id)
  where paypal_subscription_id is not null;

alter table public.dunning_logs
  drop constraint if exists dunning_logs_payment_method_type_check;
alter table public.dunning_logs
  add constraint dunning_logs_payment_method_type_check
    check (payment_method_type in ('card', 'sepa_debit', 'paypal'));

-- Credenziali PayPal del merchant (Client ID, Secret, Webhook ID), inserite
-- da /dashboard/impostazioni (scheda "PayPal Subscriptions") e usate da
-- src/lib/paypal.ts per autenticarsi verso l'API PayPal (OAuth client
-- credentials) e verificare la firma degli eventi in arrivo sul webhook
-- universale (src/app/api/v1/webhooks/paypal/[apiKey]/route.ts). Stessa
-- postura di public.merchant_api_keys: una riga per merchant, chiavi in
-- chiaro (accesso solo via service role lato server).
create table if not exists public.paypal_settings (
  user_id uuid primary key references public.users (id) on delete cascade,
  client_id text not null default '',
  client_secret text not null default '',
  webhook_id text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.paypal_settings enable row level security;
grant select, insert, update, delete on public.paypal_settings to service_role;
