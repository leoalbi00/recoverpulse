-- Switch sandbox/live per l'onboarding OAuth Partner PayPal (src/lib/paypal.ts,
-- PAYPAL_ENV): ogni connessione memorizza l'ambiente usato al momento del
-- collegamento, così le chiamate successive per conto del merchant (verifica
-- firma webhook, lettura subscription, refresh token) restano coerenti anche
-- se PAYPAL_ENV viene cambiata in seguito sul deployment. Stesso principio di
-- connected_gocardless_accounts.environment (20260916120100_connected_gocardless_accounts.sql).

alter table public.paypal_settings
  add column if not exists environment text not null default 'live'
    check (environment in ('live', 'sandbox'));
