-- Aggiunge l'URL della fattura ospitata da Stripe (hosted_invoice_url) alle
-- transazioni fallite: il webhook (src/app/api/webhooks/stripe/route.ts) lo
-- riceve già nel payload di invoice.payment_failed / invoice.paid ma finora
-- non veniva persistito.

alter table public.failed_transactions
  add column if not exists hosted_invoice_url text;
