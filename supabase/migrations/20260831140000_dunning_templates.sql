-- Editor dei template dunning di /dashboard/dunning
-- (src/lib/dunning-templates.ts): toggle "Automazione" globale + oggetto,
-- corpo, ritardo (T+giorni) e stato attivo/disattivo per ciascuno dei 3 step
-- della sequenza (immediate, first_reminder, final_notice). Letta a runtime
-- da src/lib/dunning.ts (webhook), src/app/api/cron/dunning/route.ts e
-- src/lib/email.ts per generare davvero le email di dunning — prima viveva
-- solo in memoria (globalThis), quindi ogni cold start su Vercel perdeva le
-- modifiche salvate dalla dashboard e tornava ai default.
--
-- Due tabelle:
-- - dunning_template_settings: singleton (id fisso), stessa postura di
--   public.merchant_settings, per il toggle "Automazione" globale.
-- - dunning_template_steps: una riga per step, chiave naturale step_id
--   invece di un uuid perché gli step sono un insieme fisso e noto (lo
--   stesso vincolato anche lato applicativo, vedi DunningTemplateStepId).
--
-- label/description di ciascuno step (testo descrittivo mostrato in
-- dashboard, mai modificabile dall'editor: nessun input per questi campi in
-- dunning-templates-manager.tsx) restano hardcoded lato applicativo invece
-- che duplicati qui, per non trattare come "dato" un testo di UI immutabile.
--
-- RLS abilitata senza policy anon/authenticated su entrambe: accesso solo
-- via service role lato server.

create table if not exists public.dunning_template_settings (
  id text primary key default 'default',
  automation_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.dunning_template_steps (
  step_id text primary key check (step_id in ('immediate', 'first_reminder', 'final_notice')),
  enabled boolean not null default true,
  delay_days integer not null default 0,
  subject text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

alter table public.dunning_template_settings enable row level security;
alter table public.dunning_template_steps enable row level security;

grant select, insert, update, delete on public.dunning_template_settings to service_role;
grant select, insert, update, delete on public.dunning_template_steps to service_role;

insert into public.dunning_template_settings (id, automation_enabled)
values ('default', true)
on conflict (id) do nothing;

-- Seed con gli stessi default storici di src/lib/dunning-templates.ts
-- (VARIABLE_PLACEHOLDER_BODY), così un deploy che parte da zero si comporta
-- come prima della migrazione a Supabase.
insert into public.dunning_template_steps (step_id, enabled, delay_days, subject, body) values
  (
    'immediate',
    true,
    0,
    'Il pagamento per {{nome_piano}} non è andato a buon fine',
    $body$Ciao {{nome_cliente}},

Abbiamo riscontrato un problema con il tuo ultimo pagamento. Il pagamento di {{importo}} per {{nome_piano}} non è ancora andato a buon fine.

Aggiorna il tuo metodo di pagamento qui:
{{link_recupero}}

Grazie,
Il team$body$
  ),
  (
    'first_reminder',
    true,
    3,
    'Promemoria: {{nome_piano}} in attesa di pagamento',
    $body$Ciao {{nome_cliente}},

Questo è un promemoria: il tuo abbonamento è ancora sospeso. Il pagamento di {{importo}} per {{nome_piano}} non è ancora andato a buon fine.

Aggiorna il tuo metodo di pagamento qui:
{{link_recupero}}

Grazie,
Il team$body$
  ),
  (
    'final_notice',
    true,
    7,
    'Importante: Aggiorna il tuo metodo di pagamento per {{nome_azienda}}',
    $body$Ciao {{nome_cliente}},

Questo è l'ultimo avviso prima della sospensione dell'abbonamento. Il pagamento di {{importo}} per {{nome_piano}} non è ancora andato a buon fine.

Aggiorna il tuo metodo di pagamento qui:
{{link_recupero}}

Grazie,
Il team$body$
  )
on conflict (step_id) do nothing;
