-- I campi di timing (timing_step1/2/3_minutes) di public.dunning_settings
-- sono rimasti orfani dopo che l'invio dei solleciti dunning è stato
-- agganciato ai delayDays configurati per ciascuno step in
-- public.dunning_template_steps (vedi src/app/api/cron/dunning/route.ts):
-- nessuna logica di invio legge più questi valori, ma restavano modificabili
-- da /dashboard/sequenze ("Tempi di attesa sequenza automatica"), facendo
-- credere al merchant che avessero ancora effetto. Rimossi sia qui che dalla
-- UI (src/components/dashboard/dunning-sequences-panel.tsx), che ora espone
-- solo i canali attivi.

alter table public.dunning_settings
  drop column if exists timing_step1_minutes,
  drop column if exists timing_step2_minutes,
  drop column if exists timing_step3_minutes;
