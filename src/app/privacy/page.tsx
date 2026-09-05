import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Privacy Policy — RecoverPulse",
};

const TOC = [
  { id: "titolare", label: "Titolare del trattamento" },
  { id: "dati-raccolti", label: "Categorie di dati raccolti" },
  { id: "finalita-basi", label: "Finalità e basi giuridiche" },
  { id: "modalita-sicurezza", label: "Modalità del trattamento e sicurezza" },
  { id: "comunicazione-terzi", label: "Comunicazione dei dati a terzi" },
  { id: "trasferimenti-extra-ue", label: "Trasferimenti extra-UE" },
  { id: "conservazione", label: "Periodo di conservazione" },
  { id: "diritti", label: "Diritti dell'interessato" },
  { id: "conferimento", label: "Natura del conferimento dei dati" },
  { id: "processi-automatizzati", label: "Processi decisionali automatizzati" },
  { id: "cookie", label: "Cookie" },
  { id: "modifiche", label: "Modifiche all'informativa" },
];

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updatedAt="5 settembre 2026" toc={TOC}>
      <LegalSection id="titolare" title="1. Titolare del trattamento">
        <p>
          Titolare del trattamento dei dati personali raccolti tramite il sito e la dashboard RecoverPulse è la
          società indicata nei Termini e Condizioni di Servizio (di seguito, &quot;RecoverPulse&quot; o il
          &quot;Titolare&quot;), contattabile all&apos;indirizzo email di supporto indicato in fase di
          registrazione e nella dashboard.
        </p>
        <p>
          La presente informativa disciplina il trattamento dei dati personali dei referenti e utenti del
          Merchant (persona fisica che opera per conto dell&apos;azienda cliente). Il trattamento dei dati
          personali dei Clienti Finali del Merchant, effettuato da RecoverPulse in qualità di responsabile del
          trattamento per conto del Merchant, è disciplinato dal{" "}
          <a href="/dpa" className="text-emerald-400 hover:underline">
            Data Processing Agreement (DPA)
          </a>
          , stipulato tra RecoverPulse e il Merchant medesimo.
        </p>
      </LegalSection>

      <LegalSection id="dati-raccolti" title="2. Categorie di dati raccolti">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Dati di registrazione e account:</strong> nome, cognome, indirizzo email, telefono,
            ragione sociale, Partita IVA/Codice Fiscale, indirizzo di sede legale, credenziali di accesso.
          </li>
          <li>
            <strong>Dati di fatturazione:</strong> gestiti direttamente da Stripe in qualità di responsabile
            del pagamento; RecoverPulse riceve unicamente informazioni sintetiche sullo stato
            dell&apos;abbonamento e sugli importi fatturati, non i dati dello strumento di pagamento.
          </li>
          <li>
            <strong>Dati tecnici legati all&apos;account Stripe collegato dal Merchant:</strong> limitati alle
            informazioni necessarie a individuare i pagamenti falliti e contattare il Cliente Finale (nome,
            email, importo, stato del pagamento, identificativo abbonamento).
          </li>
          <li>
            <strong>Dati di navigazione e log tecnici:</strong> indirizzo IP, tipo di browser, pagine visitate,
            timestamp di accesso, raccolti automaticamente per finalità di sicurezza e diagnostica.
          </li>
          <li>
            <strong>Comunicazioni con il supporto:</strong> contenuto delle richieste di assistenza inviate dal
            Merchant.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="finalita-basi" title="3. Finalità e basi giuridiche">
        <p>I dati sono trattati per le seguenti finalità e sulla base delle rispettive basi giuridiche:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Esecuzione del contratto (art. 6, par. 1, lett. b, GDPR):</strong> erogazione del Servizio,
            gestione dell&apos;account, fatturazione, assistenza clienti;
          </li>
          <li>
            <strong>Adempimento di obblighi legali (art. 6, par. 1, lett. c, GDPR):</strong> adempimenti fiscali,
            contabili e conservazione della documentazione richiesta dalla normativa applicabile;
          </li>
          <li>
            <strong>Legittimo interesse del Titolare (art. 6, par. 1, lett. f, GDPR):</strong> sicurezza
            informatica, prevenzione di frodi e usi impropri del Servizio, miglioramento e sviluppo del
            prodotto, comunicazioni relative ad aggiornamenti significativi del Servizio, difesa di un diritto
            in sede giudiziale; tale interesse è stato bilanciato con i diritti e le libertà fondamentali degli
            interessati, e non prevale su di essi.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="modalita-sicurezza" title="4. Modalità del trattamento e sicurezza">
        <p>
          Il trattamento è effettuato con strumenti informatici e telematici, con logiche strettamente correlate
          alle finalità indicate e, comunque, in modo da garantire la sicurezza e la riservatezza dei dati.
        </p>
        <p>RecoverPulse adotta misure tecniche e organizzative adeguate, tra cui in particolare:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>cifratura dei dati in transito</strong> mediante protocollo TLS su tutte le comunicazioni tra client, dashboard e API;</li>
          <li><strong>cifratura dei dati a riposo</strong> sui sistemi di archiviazione dei Sub-fornitori infrastrutturali;</li>
          <li>autenticazione degli accessi alla dashboard e controllo dei privilegi basato sul ruolo;</li>
          <li>segregazione logica dei dati tra i diversi account Merchant;</li>
          <li>monitoraggio degli accessi e conservazione di log a fini di sicurezza;</li>
          <li>procedure interne di gestione degli incidenti di sicurezza.</li>
        </ul>
      </LegalSection>

      <LegalSection id="comunicazione-terzi" title="5. Comunicazione dei dati a terzi">
        <p>
          I dati sono comunicati ai fornitori tecnici necessari all&apos;erogazione del Servizio, nominati, ove
          applicabile, responsabili del trattamento ai sensi dell&apos;art. 28 GDPR, tra cui: Stripe (pagamenti),
          Resend (invio email), Supabase (archiviazione dati) e Vercel (hosting ed esecuzione
          dell&apos;applicazione). I dati possono inoltre essere comunicati a consulenti, revisori e autorità
          pubbliche, nei limiti previsti dalla legge o per l&apos;esercizio di un diritto in sede giudiziale. I
          dati non sono in alcun caso venduti a terzi né utilizzati per finalità di marketing di soggetti terzi.
        </p>
      </LegalSection>

      <LegalSection id="trasferimenti-extra-ue" title="6. Trasferimenti extra-UE">
        <p>
          Alcuni dei fornitori indicati all&apos;art. 5 possono trattare i dati anche al di fuori dello Spazio
          Economico Europeo. In tali casi, il trasferimento avviene sulla base di una decisione di adeguatezza
          della Commissione Europea, di Clausole Contrattuali Standard approvate dalla Commissione Europea, o di
          altre garanzie adeguate riconosciute idonee dal Capo V del GDPR. Copia di tali garanzie può essere
          richiesta contattando il Titolare ai recapiti indicati all&apos;art. 1.
        </p>
      </LegalSection>

      <LegalSection id="conservazione" title="7. Periodo di conservazione">
        <p>
          I dati relativi all&apos;account sono conservati per l&apos;intera durata del rapporto contrattuale e,
          successivamente alla cessazione, per il periodo necessario ad adempiere agli obblighi fiscali,
          contabili e di legge applicabili (di norma 10 anni per la documentazione contabile e fiscale ai sensi
          della normativa italiana), nonché per il tempo necessario alla difesa di un diritto in sede
          giudiziale. I log tecnici e di sicurezza sono conservati per un periodo limitato, proporzionato alle
          finalità di sicurezza perseguite.
        </p>
      </LegalSection>

      <LegalSection id="diritti" title="8. Diritti dell'interessato">
        <p>
          In qualità di interessato, hai diritto di ottenere dal Titolare, nei casi previsti, l&apos;accesso ai
          tuoi dati personali (art. 15 GDPR), la rettifica dei dati inesatti (art. 16 GDPR), la cancellazione
          (art. 17 GDPR), la limitazione del trattamento (art. 18 GDPR), la portabilità dei dati (art. 20 GDPR)
          e di opporti al trattamento (art. 21 GDPR). Hai inoltre diritto di proporre reclamo
          all&apos;<strong>Autorità Garante per la Protezione dei Dati Personali</strong> (www.garanteprivacy.it)
          qualora ritenga che il trattamento dei tuoi dati violi la normativa applicabile.
        </p>
        <p>
          Per esercitare tali diritti, è possibile contattare il Titolare all&apos;indirizzo indicato
          all&apos;art. 1. Il Titolare risponde alle richieste senza ingiustificato ritardo e comunque entro i
          termini previsti dal GDPR.
        </p>
      </LegalSection>

      <LegalSection id="conferimento" title="9. Natura del conferimento dei dati">
        <p>
          Il conferimento dei dati necessari alla registrazione e all&apos;erogazione del Servizio è
          obbligatorio: il mancato conferimento comporta l&apos;impossibilità di attivare l&apos;account e di
          fruire del Servizio. Il conferimento di dati facoltativi (es. informazioni aggiuntive fornite al
          supporto) non pregiudica la fruizione del Servizio.
        </p>
      </LegalSection>

      <LegalSection id="processi-automatizzati" title="10. Processi decisionali automatizzati">
        <p>
          Il Servizio genera in modo automatizzato le comunicazioni di sollecito sulla base delle regole di
          dunning configurate dal Merchant; tale automazione non produce, nei confronti dei referenti del
          Merchant destinatari della presente informativa, effetti giuridici che li riguardino né incide in
          modo analogo significativamente sulla loro persona, e non costituisce pertanto un processo decisionale
          automatizzato ai sensi dell&apos;art. 22 GDPR.
        </p>
      </LegalSection>

      <LegalSection id="cookie" title="11. Cookie">
        <p>
          Per informazioni sui cookie utilizzati dal sito e dalla dashboard, consulta la{" "}
          <a href="/cookie" className="text-emerald-400 hover:underline">
            Cookie Policy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="modifiche" title="12. Modifiche all'informativa">
        <p>
          Il Titolare si riserva il diritto di modificare o aggiornare la presente informativa in qualsiasi
          momento, anche in conseguenza di modifiche normative. Le modifiche sostanziali saranno comunicate
          agli utenti tramite la dashboard o l&apos;indirizzo email associato all&apos;account, con indicazione
          della data di ultimo aggiornamento riportata in testa al presente documento.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
