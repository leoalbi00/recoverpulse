-- Centro Notifiche in-app della dashboard: eventi di business (nuovo lead
-- pilota, pagamento recuperato, avvisi) mostrati nel pannello a campanella
-- (src/components/dashboard/notification-bell.tsx). Scritte lato server da
-- src/lib/notifications.ts, chiamato da src/lib/pilot-requests.ts e dal
-- webhook Stripe (src/app/api/webhooks/stripe/route.ts).
--
-- Nessuna colonna user_id: come per public.failed_transactions, l'app non ha
-- ancora un concetto di isolamento multi-tenant sui dati di business, quindi
-- le notifiche sono condivise da tutti gli utenti che accedono alla dashboard.
--
-- RLS abilitata senza policy anon/authenticated, stessa postura delle altre
-- tabelle applicative: solo il service role (src/lib/supabase-admin.ts) può
-- leggere/scrivere.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_created_at_idx on public.notifications (created_at desc);
create index if not exists notifications_unread_idx on public.notifications (is_read) where is_read = false;

alter table public.notifications enable row level security;

grant select, insert, update, delete on public.notifications to service_role;
