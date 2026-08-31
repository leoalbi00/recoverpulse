-- Il vincolo CHECK esistente su public.notifications.type ammette solo
-- ('lead', 'recovery'), ma src/lib/notifications.ts usa anche 'warning' per
-- notifyPaymentFailed (webhook Stripe invoice.payment_failed): ogni notifica
-- di pagamento fallito ha sempre violato il vincolo in silenzio (l'errore è
-- catturato e loggato, non propagato) da quando questa funzionalità esiste.
-- Trovato con un test end-to-end del flusso dunning.
--
-- drop/add invece di un solo alter: il nome del vincolo esistente non è
-- garantito essere esattamente "notifications_type_check" (dipende da come è
-- stato creato), quindi lo cerchiamo dinamicamente su qualunque check
-- constraint attivo sulla colonna "type" prima di ricrearlo.

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'notifications'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%type%';

  if constraint_name is not null then
    execute format('alter table public.notifications drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.notifications
  add constraint notifications_type_check check (type in ('lead', 'recovery', 'warning'));
