-- Token monouso per il login: recupero password e Magic Link
-- (src/lib/auth-tokens.ts). Tabella dedicata invece di riusare `tokens`
-- (quella esistente ha `customer_id` NOT NULL ed è di dominio Stripe/pagamenti,
-- non adatta a un contesto di autenticazione) — stesso schema hash-at-rest
-- (SHA-256, mai il token in chiaro su Supabase).
create table if not exists public.auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  purpose text not null check (purpose in ('password_reset', 'magic_link')),
  token_hash text not null unique,
  used boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists auth_tokens_user_id_idx on public.auth_tokens (user_id);

alter table public.auth_tokens enable row level security;
grant select, insert, update, delete on public.auth_tokens to service_role;
