-- Sostituisce l'inserimento manuale di Client ID/Secret/Webhook ID PayPal
-- (20260914200000_paypal_recurring_payments.sql) con il collegamento OAuth
-- 1-click via PayPal Partner Referrals (src/lib/paypal-partner.ts,
-- src/app/api/paypal/connect/{authorize,callback}/route.ts): il merchant non
-- crea più una propria app PayPal REST, collega direttamente il proprio
-- account PayPal a OmniRev.
--
-- access_token/refresh_token sono cifrati applicativamente prima del
-- salvataggio (src/lib/encryption.ts, CREDENTIALS_ENCRYPTION_KEY) — a
-- differenza del resto delle credenziali del progetto (in chiaro per scelta
-- deliberata), qui il requisito è esplicito perché si tratta di token OAuth
-- che agiscono per conto del merchant, non solo di una chiave webhook.

alter table public.paypal_settings
  drop column if exists client_id,
  drop column if exists client_secret;

alter table public.paypal_settings
  add column if not exists merchant_id text not null default '',
  add column if not exists email text,
  add column if not exists access_token text not null default '',
  add column if not exists refresh_token text,
  add column if not exists token_expires_at timestamptz,
  add column if not exists connected_at timestamptz;
