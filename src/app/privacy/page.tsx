import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Privacy Policy — RecoverPulse",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updatedAt="5 settembre 2026">
      <LegalSection title="1. Titolare del trattamento">
        <p>
          Titolare del trattamento per i dati raccolti tramite il sito e la
          dashboard RecoverPulse è la società indicata nei Termini di
          Servizio, contattabile all&apos;indirizzo email di supporto
          indicato in fase di registrazione.
        </p>
      </LegalSection>

      <LegalSection title="2. Dati raccolti">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Dati di registrazione: nome, cognome, email, telefono, ragione
            sociale, Partita IVA/Codice Fiscale, indirizzo di sede legale.
          </li>
          <li>
            Dati di fatturazione, gestiti direttamente da Stripe come
            responsabile del pagamento.
          </li>
          <li>
            Dati tecnici legati all&apos;account Stripe collegato dal
            Cliente, limitati alle informazioni necessarie a individuare i
            pagamenti falliti e contattare il cliente finale (nome, email,
            importo, stato del pagamento).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalità del trattamento">
        <p>
          I dati sono trattati per: erogare il Servizio (individuazione
          pagamenti falliti e invio solleciti dunning), gestire
          l&apos;account e la fatturazione, fornire assistenza e migliorare
          il Servizio.
        </p>
      </LegalSection>

      <LegalSection title="4. Base giuridica e conservazione">
        <p>
          Il trattamento si basa sull&apos;esecuzione del contratto di
          servizio. I dati sono conservati per la durata dell&apos;account e
          per il periodo richiesto dagli obblighi fiscali e contabili
          applicabili.
        </p>
      </LegalSection>

      <LegalSection title="5. Comunicazione a terzi">
        <p>
          I dati sono condivisi con i fornitori tecnici necessari
          all&apos;erogazione del Servizio (es. Stripe per i pagamenti,
          Resend per l&apos;invio delle email di sollecito, Supabase per
          l&apos;archiviazione), nei limiti indicati nella{" "}
          <a href="/dpa" className="text-emerald-400 hover:underline">
            Nomina a Responsabile del Trattamento (DPA)
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Diritti dell'interessato">
        <p>
          L&apos;interessato può richiedere in qualsiasi momento accesso,
          rettifica, cancellazione, limitazione del trattamento e
          portabilità dei propri dati, contattando il titolare
          all&apos;indirizzo indicato al punto 1.
        </p>
      </LegalSection>

      <LegalSection title="7. Cookie">
        <p>
          Per informazioni sui cookie utilizzati dal sito e dalla dashboard,
          consulta la{" "}
          <a href="/cookie" className="text-emerald-400 hover:underline">
            Cookie Policy
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
