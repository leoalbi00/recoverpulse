-- Estende dunning_logs per la sequenza automatica di solleciti via cron
-- (vedi src/app/api/cron/dunning/route.ts): ogni invio va legato alla fattura
-- e allo step (giorni trascorsi dalla creazione) così da poter verificare, con
-- un vincolo unique, che lo stesso sollecito non sia mai inviato due volte.
--
-- `user_id` diventa nullable per lo stesso motivo di public.tokens.user_id
-- (vedi 20260816120000_init_schema.sql): il cron lavora su
-- failed_transactions, che non ha un RecoverPulse user_id associato senza
-- Stripe Connect.

alter table public.dunning_logs
  alter column user_id drop not null;

alter table public.dunning_logs
  add column if not exists invoice_id text not null references public.failed_transactions (invoice_id) on delete cascade,
  add column if not exists step_days integer not null;

alter table public.dunning_logs
  add constraint dunning_logs_invoice_step_unique unique (invoice_id, step_days);

create index if not exists dunning_logs_invoice_id_idx on public.dunning_logs (invoice_id);
