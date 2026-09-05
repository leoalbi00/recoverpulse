-- Dati legali/fiscali obbligatori del merchant, richiesti per fatturazione e
-- adempimenti (Termini di Servizio, DPA): nome/cognome del referente,
-- ragione sociale (company_name, già presente) e partita IVA/codice
-- fiscale + indirizzo di sede legale. Mostrati in cima a
-- /dashboard/impostazioni, prima dell'integrazione Stripe e delle regole
-- dunning — vedi src/lib/merchant-settings.ts.
alter table public.merchant_settings
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists vat_number text not null default '',
  add column if not exists legal_address text not null default '';

-- Nome mittente mostrato nelle email di sollecito (fallback su company_name
-- se vuoto): campo opzionale del blocco "Brand & Personalizzazione", in
-- fondo alla pagina insieme a logo e colore primario.
alter table public.merchant_settings
  add column if not exists sender_name text;
