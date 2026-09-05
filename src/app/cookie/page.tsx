import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Cookie Policy — RecoverPulse",
};

export default function CookiePage() {
  return (
    <LegalPage title="Cookie Policy" updatedAt="5 settembre 2026">
      <LegalSection title="1. Cosa sono i cookie">
        <p>
          I cookie sono piccoli file di testo che i siti visitati inviano al
          dispositivo dell&apos;utente, dove vengono memorizzati per essere
          poi ritrasmessi agli stessi siti alla visita successiva.
        </p>
      </LegalSection>

      <LegalSection title="2. Cookie tecnici">
        <p>
          Il sito e la dashboard RecoverPulse utilizzano cookie tecnici
          necessari al funzionamento del servizio, in particolare per
          mantenere la sessione autenticata dell&apos;utente dopo il login.
          Questi cookie non richiedono consenso preventivo ai sensi della
          normativa applicabile.
        </p>
      </LegalSection>

      <LegalSection title="3. Cookie di terze parti">
        <p>
          Alcune pagine possono caricare risorse di fornitori terzi (es.
          Stripe per l&apos;elaborazione dei pagamenti) che potrebbero
          impostare propri cookie secondo le rispettive privacy policy.
        </p>
      </LegalSection>

      <LegalSection title="4. Gestione dei cookie">
        <p>
          È possibile gestire o disabilitare i cookie tramite le
          impostazioni del proprio browser. La disabilitazione dei cookie
          tecnici potrebbe compromettere il corretto funzionamento della
          dashboard.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
