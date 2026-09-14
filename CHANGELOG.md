# Changelog

## 2026-09-14

### Fixed

- Applicata in produzione la migration `supabase/migrations/20260913120000_sdd_dunning.sql`
  (tabella `merchant_api_keys`; colonne `payment_method_type`, `iban_last4`,
  `mandate_reference`, `failure_code` su `failed_transactions`; colonna
  `payment_method_type` su `dunning_logs`), risultata mai eseguita sul database
  Supabase collegato nonostante fosse già committata nel repo. Risolveva
  l'errore `Could not find the table 'public.merchant_api_keys' in the schema
  cache`, che rompeva la sezione "Integrazione SDD / SEPA" in
  `/dashboard/impostazioni`.
