-- Richieste di integrazione pilota inviate dal modulo di lead-gen in fondo
-- alla landing page (/, sezione Pricing → src/components/landing/pilot-request-form.tsx).
-- Endpoint pubblico e non autenticato (chiunque visiti il sito può inviare il
-- modulo): l'insert avviene solo lato server con la service role key
-- (src/app/api/pilot-request/route.ts), mai da un client anon diretto.
--
-- RLS abilitata senza policy anon/authenticated, stessa postura di tutte le
-- altre tabelle applicative: solo il service role può leggere/scrivere.

create table if not exists public.pilot_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text not null,
  estimated_mrr text,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists pilot_requests_created_at_idx on public.pilot_requests (created_at desc);

alter table public.pilot_requests enable row level security;

grant select, insert, update, delete on public.pilot_requests to service_role;
