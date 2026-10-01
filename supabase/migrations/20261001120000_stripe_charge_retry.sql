-- Riaddebito automatico delle fatture Stripe fallite
-- (src/app/api/cron/smart-retry/route.ts): distinto dal "smart retry" di
-- 20260920120000 (next_retry_at), che pianifica solo un SOLLECITO email fuori
-- calendario. Qui si pianifica un nuovo tentativo di ADDEBITO via
-- `stripe.invoices.pay`, con backoff esponenziale:
--   tentativo 1: +12h dal fallimento (impostato dal webhook)
--   tentativo 2: +24h dal tentativo 1
--   tentativo 3: +48h dal tentativo 2
-- charge_retry_count: tentativi già eseguiti (max 3). Fa anche da lock
-- ottimistico: il cron incrementa il contatore con un update condizionato al
-- valore letto PRIMA di chiamare Stripe, così due esecuzioni concorrenti non
-- addebitano due volte la stessa fattura.
-- next_charge_retry_at: prossimo tentativo, null = nessuno pianificato.
-- Colonne non incluse nell'upsert di recordFailedPayment
-- (src/lib/transactions.ts): un nuovo invoice.payment_failed per la stessa
-- fattura (anche quello generato dal nostro stesso tentativo fallito) non
-- azzera il contatore.
alter table public.failed_transactions
  add column if not exists charge_retry_count integer not null default 0
    check (charge_retry_count >= 0),
  add column if not exists next_charge_retry_at timestamptz;

create index if not exists failed_transactions_next_charge_retry_at_idx
  on public.failed_transactions (next_charge_retry_at)
  where next_charge_retry_at is not null;
