-- Stato dell'abbonamento SaaS di RecoverPulse (il piano Starter/Growth/Scale
-- che l'utente paga per usare RecoverPulse, src/lib/plans.ts) — non va
-- confuso con lo Stripe account COLLEGATO del merchant (connected_stripe_accounts,
-- 20260831170000): sono due relazioni Stripe distinte, questa è quella con
-- l'account PIATTAFORMA di RecoverPulse (src/lib/stripe.ts getPlatformStripeClient).
--
-- Sostituisce la Map in-memory di src/lib/billing.ts (non sopravviveva ai
-- cold start in produzione, la sua stessa nota lo segnalava). Popolata dal
-- webhook piattaforma (checkout.session.completed +
-- customer.subscription.created/updated/deleted), letta da src/lib/paywall.ts
-- per bloccare i report avanzati della dashboard a prova scaduta senza
-- abbonamento attivo.
--
-- subscription_status/subscription_plan restano testo libero (niente check):
-- rispecchiano l'unione aperta di Stripe.Subscription.Status, che include
-- valori futuri non enumerabili qui.
alter table public.users
  add column if not exists stripe_customer_id text unique,
  add column if not exists subscription_status text,
  add column if not exists subscription_plan text;

create index if not exists users_stripe_customer_id_idx on public.users (stripe_customer_id);
