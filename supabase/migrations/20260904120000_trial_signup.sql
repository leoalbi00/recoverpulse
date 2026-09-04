-- Flusso di onboarding self-serve "Inizia la Prova Gratuita" (v1.1):
-- registrazione a 3 step con verifica email tramite codice OTP a 6 cifre
-- (src/app/start-trial/page.tsx, src/lib/trial-signup.ts). Distinto dalla
-- registrazione invito-only esistente (src/app/api/register), che resta
-- attiva e invariata per accessi diretti non pubblicizzati in home page.
--
-- `trial_ends_at` su `users`: marcatore di prova a livello di ACCOUNT,
-- impostato a +14 giorni dalla creazione dell'utente in questo flusso.
-- Distinto dalla prova "a livello di integrazione" già esistente in
-- src/lib/trial.ts (legata a connected_stripe_accounts.trial_started_at,
-- che parte solo al collegamento Stripe, non alla registrazione): i due
-- concetti coesistono per ora, una futura iterazione dovrà riconciliarli in
-- un'unica fonte di verità per il paywall (src/lib/paywall.ts).
alter table public.users
  add column if not exists trial_ends_at timestamptz;

-- Stato delle registrazioni self-serve non ancora completate: dati del form
-- Step 1 (nome, cognome, email, telefono) + hash dell'OTP inviato via email,
-- in attesa della verifica del codice e della creazione della password
-- (Step 2/3). Riga per email e non per user_id: l'utente non esiste ancora
-- a questo punto del flusso — viene creato solo al completamento (Step 3).
-- `email unique` con upsert onConflict "email" lato applicativo: un nuovo
-- invio del codice sovrascrive la riga precedente invece di accumularne di
-- orfane per lo stesso indirizzo.
create table if not exists public.trial_signups (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text not null,
  otp_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists trial_signups_email_idx on public.trial_signups (email);

alter table public.trial_signups enable row level security;
grant select, insert, update, delete on public.trial_signups to service_role;
