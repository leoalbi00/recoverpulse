-- Blocco 5 (Dunning & Email Automation): traccia quando il primo sollecito
-- ("immediate") è stato effettivamente inviato, senza toccare `status`.
--
-- Nota: `status` resta in_corso/recuperato/perso perché guida sia il cron di
-- dunning (src/app/api/cron/dunning/route.ts, listActiveFailedTransactions
-- filtra su 'in_corso' per decidere a chi inviare il prossimo step) sia il
-- portale /pay (getTransactionByCustomerId). Introdurre uno stato aggiuntivo
-- tipo 'email_sent' al posto di 'in_corso' interromperebbe i solleciti
-- successivi (first_reminder, final_notice): first_notice_sent_at è quindi un
-- campo puramente informativo, non uno stato del funnel.
alter table public.failed_transactions
  add column if not exists first_notice_sent_at timestamptz;
