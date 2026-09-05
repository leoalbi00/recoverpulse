import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Cookie Policy — RecoverPulse",
};

const TOC = [
  { id: "cosa-sono", label: "Cosa sono i cookie" },
  { id: "cookie-tecnici", label: "Cookie tecnici utilizzati" },
  { id: "nessuna-profilazione", label: "Assenza di cookie di profilazione" },
  { id: "base-giuridica-durata", label: "Base giuridica e durata" },
  { id: "gestione", label: "Gestione delle preferenze" },
  { id: "modifiche", label: "Aggiornamenti alla Cookie Policy" },
];

export default function CookiePage() {
  return (
    <LegalPage title="Cookie Policy" updatedAt="5 settembre 2026" toc={TOC}>
      <LegalSection id="cosa-sono" title="1. Cosa sono i cookie">
        <p>
          I cookie sono piccoli file di testo che i siti visitati inviano al dispositivo dell&apos;utente, dove
          vengono memorizzati per essere poi ritrasmessi agli stessi siti alla visita successiva. Il sito e la
          dashboard RecoverPulse adottano una politica <strong>cookie-essenziale</strong>: sono utilizzati
          esclusivamente cookie tecnici, strettamente necessari all&apos;erogazione del Servizio.
        </p>
      </LegalSection>

      <LegalSection id="cookie-tecnici" title="2. Cookie tecnici utilizzati">
        <p>Il sito e la dashboard RecoverPulse utilizzano esclusivamente le seguenti categorie di cookie tecnici:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Cookie di autenticazione di sessione:</strong> necessari a mantenere l&apos;utente
            autenticato dopo il login e a consentire l&apos;accesso alle aree riservate della dashboard.
          </li>
          <li>
            <strong>Cookie di sicurezza:</strong> utilizzati per la protezione da richieste fraudolente
            (es. protezione CSRF) e per garantire l&apos;integrità delle sessioni utente.
          </li>
        </ul>
        <p>
          Ai sensi dell&apos;art. 122 del Codice Privacy (D.Lgs. 196/2003) e delle linee guida
          dell&apos;Autorità Garante in materia di cookie, i cookie tecnici sopra descritti, essendo strettamente
          necessari all&apos;erogazione del Servizio richiesto dall&apos;utente, <strong>non richiedono il
          preventivo consenso dell&apos;utente</strong>.
        </p>
      </LegalSection>

      <LegalSection id="nessuna-profilazione" title="3. Assenza di cookie di profilazione">
        <p>
          RecoverPulse <strong>non utilizza cookie di profilazione, analytics di terze parti o cookie
          pubblicitari</strong> di alcun tipo, né propri né di terze parti. Alcune pagine possono caricare
          risorse necessarie all&apos;erogazione del Servizio da fornitori terzi (es. Stripe per
          l&apos;elaborazione dei pagamenti), i quali potrebbero impostare propri cookie tecnici secondo le
          rispettive privacy policy, richiamate nelle relative interfacce.
        </p>
      </LegalSection>

      <LegalSection id="base-giuridica-durata" title="4. Base giuridica e durata">
        <p>
          I cookie tecnici di autenticazione e sicurezza sono trattati sulla base dell&apos;esecuzione del
          contratto di Servizio e del legittimo interesse del Titolare alla sicurezza dei propri sistemi. La loro
          durata è limitata al tempo strettamente necessario a garantire la sessione autenticata e la sicurezza
          della navigazione, e comunque non superiore alla durata della sessione o, per i cookie persistenti di
          autenticazione, al periodo tecnicamente necessario a mantenere l&apos;accesso senza richiedere un
          nuovo login a ogni visita.
        </p>
      </LegalSection>

      <LegalSection id="gestione" title="5. Gestione delle preferenze">
        <p>
          È possibile gestire o disabilitare i cookie in qualsiasi momento tramite le impostazioni del proprio
          browser. Si segnala che, trattandosi di cookie tecnici essenziali, la loro disabilitazione
          comprometterà il corretto funzionamento della dashboard, in particolare impedendo il mantenimento
          della sessione autenticata.
        </p>
      </LegalSection>

      <LegalSection id="modifiche" title="6. Aggiornamenti alla Cookie Policy">
        <p>
          Il Titolare si riserva il diritto di aggiornare la presente Cookie Policy in caso di modifiche alle
          tecnologie utilizzate o alla normativa applicabile. Eventuali modifiche sostanziali saranno comunicate
          tramite la dashboard, con indicazione della data di ultimo aggiornamento riportata in testa al presente
          documento.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
