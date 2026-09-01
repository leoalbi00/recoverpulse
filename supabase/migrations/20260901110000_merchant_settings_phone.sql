-- Numero di telefono aziendale: terzo campo obbligatorio del profilo
-- merchant in /dashboard/impostazioni, insieme a company_name e
-- support_email (già presenti). Il banner "Completa i dati aziendali
-- obbligatori" (src/app/dashboard/impostazioni/page.tsx) si basa su questi
-- tre campi non vuoti — vedi src/lib/merchant-settings.ts.
alter table public.merchant_settings
  add column if not exists phone text not null default '';
