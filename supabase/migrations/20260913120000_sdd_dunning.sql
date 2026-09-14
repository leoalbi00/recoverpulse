-- Motore di dunning automatico per insoluti SDD (SEPA Direct Debit),
-- alimentato da un webhook universale (/api/v1/webhooks/sdd) per gestionali/
-- CRM esterni che non passano da Stripe: un merchant che addebita i propri
-- clienti via SEPA Direct Debit può notificare OmniRev di un insoluto
-- (storno bancario, codici tipo AC01/MD01/MS02) e ricevere lo stesso
-- trattamento di dunning automatico già in produzione per le carte
-- (src/lib/dunning.ts, src/app/api/cron/dunning/route.ts).
--
-- payment_method_type distingue la provenienza della fattura fallita: 'card'
-- resta il default per non toccare il flusso Stripe esistente (webhook
-- invoice.payment_failed), 'sepa_debit' è il nuovo canale alimentato dal
-- webhook universale. iban_last4/mandate_reference/failure_code sono
-- popolati solo per 'sepa_debit'.

alter table public.failed_transactions
  add column if not exists payment_method_type text not null default 'card'
    check (payment_method_type in ('card', 'sepa_debit')),
  add column if not exists iban_last4 text,
  add column if not exists mandate_reference text,
  add column if not exists failure_code text;

create index if not exists failed_transactions_payment_method_type_idx
  on public.failed_transactions (payment_method_type);

-- Stesso campo su dunning_logs, per poter distinguere in audit/log di sistema
-- (/dashboard/developer) se un sollecito è partito da un insoluto carta o SDD.
alter table public.dunning_logs
  add column if not exists payment_method_type text not null default 'card'
    check (payment_method_type in ('card', 'sepa_debit'));

-- Una API Key per merchant, generata dalla dashboard (Impostazioni >
-- Integrazione SDD/SEPA) e usata dal gestionale/CRM esterno per autenticare
-- le chiamate al webhook universale. Chiave in chiaro (non hashata): a
-- differenza dei token del portale /pay (monouso, verificati una sola volta),
-- questa va mostrata e ricopiata dal merchant più volte nel proprio sistema
-- esterno, stessa postura di integration_settings (Resend/Twilio) già in
-- chiaro su Supabase, accesso comunque riservato al service role.
create table if not exists public.merchant_api_keys (
  user_id uuid primary key references public.users (id) on delete cascade,
  api_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.merchant_api_keys enable row level security;
grant select, insert, update, delete on public.merchant_api_keys to service_role;
