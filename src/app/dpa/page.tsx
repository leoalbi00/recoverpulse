import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Data Processing Agreement — RecoverPulse",
};

export default function DpaPage() {
  return (
    <LegalPage
      title="Data Processing Agreement (Nomina a Responsabile del Trattamento)"
      updatedAt="5 settembre 2026"
    >
      <LegalSection title="1. Premessa">
        <p>
          Il presente accordo, stipulato ai sensi dell&apos;art. 28 del
          Regolamento (UE) 2016/679 (&quot;GDPR&quot;), disciplina il
          trattamento dei dati personali che RecoverPulse (&quot;Responsabile
          del Trattamento&quot;) effettua per conto del Cliente
          (&quot;Titolare del Trattamento&quot;) nell&apos;ambito
          dell&apos;erogazione del Servizio.
        </p>
      </LegalSection>

      <LegalSection title="2. Oggetto e durata del trattamento">
        <p>
          RecoverPulse tratta i dati personali dei clienti finali del
          Titolare (nome, email, dati relativi al pagamento fallito)
          esclusivamente per individuare i pagamenti Stripe non andati a buon
          fine e inviare le comunicazioni di sollecito configurate dal
          Titolare, per la durata del contratto di servizio.
        </p>
      </LegalSection>

      <LegalSection title="3. Istruzioni del Titolare">
        <p>
          RecoverPulse tratta i dati personali unicamente sulla base di
          istruzioni documentate del Titolare, impartite tramite le
          impostazioni della dashboard (es. regole di sollecito, canali
          attivi, contenuto dei template email).
        </p>
      </LegalSection>

      <LegalSection title="4. Misure di sicurezza">
        <p>
          RecoverPulse adotta misure tecniche e organizzative adeguate a
          garantire la sicurezza dei dati trattati, tra cui cifratura in
          transito, accesso limitato al personale autorizzato e
          autenticazione per l&apos;accesso alla dashboard.
        </p>
      </LegalSection>

      <LegalSection title="5. Sub-responsabili">
        <p>
          Il Titolare autorizza il ricorso ai seguenti sub-responsabili per
          l&apos;erogazione del Servizio: Stripe (elaborazione pagamenti),
          Resend (invio email transazionali), Supabase (infrastruttura dati).
          RecoverPulse garantisce che ogni sub-responsabile sia vincolato da
          obblighi equivalenti a quelli del presente accordo.
        </p>
      </LegalSection>

      <LegalSection title="6. Assistenza al Titolare">
        <p>
          RecoverPulse assiste il Titolare, nei limiti delle proprie
          possibilità tecniche, nel rispondere alle richieste di esercizio
          dei diritti degli interessati e negli adempimenti relativi a
          sicurezza dei dati, notifica di violazioni e valutazioni
          d&apos;impatto.
        </p>
      </LegalSection>

      <LegalSection title="7. Cancellazione o restituzione dei dati">
        <p>
          Alla cessazione del Servizio, RecoverPulse cancella o restituisce
          al Titolare, su richiesta, tutti i dati personali trattati per suo
          conto, salvi gli obblighi di conservazione previsti dalla legge.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
