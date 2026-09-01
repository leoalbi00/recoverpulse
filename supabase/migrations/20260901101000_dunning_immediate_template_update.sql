-- Blocco 5 (Dunning & Email Automation): oggetto/corpo più diretti per il
-- sollecito immediato, in linea con src/lib/dunning-templates.ts
-- (defaultSteps, "immediate"). Il backfill tocca solo le righe che hanno
-- ancora il testo di default storico (seed di
-- 20260831140000_dunning_templates.sql): un merchant che ha già personalizzato
-- oggetto o corpo dal proprio account (/dashboard/dunning) non viene toccato.
update public.dunning_template_steps
set
  subject = 'Azione richiesta: aggiorna il metodo di pagamento',
  body = $body$Ciao {{nome_cliente}},

Il pagamento del tuo abbonamento non è andato a buon fine: è necessaria un'azione da parte tua per evitare l'interruzione del servizio. Il pagamento di {{importo}} per {{nome_piano}} non è ancora andato a buon fine.

Aggiorna il tuo metodo di pagamento qui:
{{link_recupero}}

Grazie,
Il team$body$,
  updated_at = now()
where step_id = 'immediate'
  and subject = 'Il pagamento per {{nome_piano}} non è andato a buon fine';
