import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Termini e Condizioni di Servizio — RecoverPulse",
};

export default function TerminiPage() {
  return (
    <LegalPage title="Termini e Condizioni di Servizio" updatedAt="5 settembre 2026">
      <LegalSection title="1. Oggetto del servizio">
        <p>
          RecoverPulse (&quot;il Servizio&quot;) è una piattaforma SaaS che
          collega l&apos;account Stripe del Cliente per individuare i
          pagamenti falliti (&quot;involuntary churn&quot;) e avviare in
          automatico sequenze di sollecito (dunning) multi-canale, con un
          portale self-service per l&apos;aggiornamento del metodo di
          pagamento.
        </p>
      </LegalSection>

      <LegalSection title="2. Account e prova gratuita">
        <p>
          L&apos;attivazione avviene tramite registrazione self-serve su{" "}
          <code>/start-trial</code>, con un periodo di prova gratuita di 14
          giorni senza necessità di carta di credito. Al termine della prova,
          l&apos;accesso alle funzionalità avanzate richiede la sottoscrizione
          di uno dei piani a pagamento indicati in <code>/#pricing</code>.
        </p>
      </LegalSection>

      <LegalSection title="3. Obblighi del Cliente">
        <p>
          Il Cliente dichiara di avere titolo per collegare il proprio
          account Stripe e di essere responsabile dell&apos;accuratezza dei
          dati aziendali forniti (ragione sociale, Partita IVA/Codice
          Fiscale, indirizzo di sede legale) inseriti in fase di
          registrazione e nelle Impostazioni del proprio account.
        </p>
      </LegalSection>

      <LegalSection title="4. Trattamento dei dati">
        <p>
          Il trattamento dei dati personali dei clienti finali del Cliente,
          effettuato da RecoverPulse in qualità di responsabile del
          trattamento, è disciplinato dalla{" "}
          <a href="/dpa" className="text-emerald-400 hover:underline">
            Nomina a Responsabile del Trattamento (DPA)
          </a>{" "}
          e dalla{" "}
          <a href="/privacy" className="text-emerald-400 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="5. Fatturazione e recesso">
        <p>
          I piani sono fatturati mensilmente tramite Stripe. Il Cliente può
          annullare l&apos;abbonamento in qualsiasi momento dalle
          Impostazioni della dashboard, senza vincoli di durata minima.
        </p>
      </LegalSection>

      <LegalSection title="6. Limitazione di responsabilità">
        <p>
          Il Servizio è fornito &quot;così com&apos;è&quot;. RecoverPulse non
          garantisce il recupero di uno specifico importo o percentuale di
          fatturato e non risponde di interruzioni del servizio Stripe o dei
          canali di notifica di terze parti.
        </p>
      </LegalSection>

      <LegalSection title="7. Legge applicabile">
        <p>
          I presenti Termini sono regolati dalla legge italiana. Per
          qualsiasi controversia è competente il foro del luogo in cui
          RecoverPulse ha sede legale.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
