import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Data Processing Agreement — RecoverPulse",
};

const TOC = [
  { id: "premessa", label: "Premessa e ambito di applicazione" },
  { id: "definizioni", label: "Definizioni" },
  { id: "ruoli", label: "Ruoli delle parti" },
  { id: "oggetto-durata", label: "Oggetto, natura e durata del trattamento" },
  { id: "categorie-dati", label: "Categorie di interessati e di dati" },
  { id: "istruzioni", label: "Istruzioni documentate del Titolare" },
  { id: "obblighi-responsabile", label: "Obblighi del Responsabile" },
  { id: "riservatezza-personale", label: "Riservatezza del personale" },
  { id: "misure-sicurezza", label: "Misure di sicurezza (art. 32 GDPR)" },
  { id: "sub-responsabili", label: "Sub-responsabili autorizzati" },
  { id: "assistenza-titolare", label: "Assistenza al Titolare" },
  { id: "data-breach", label: "Gestione dei Data Breach" },
  { id: "audit", label: "Verifiche e audit" },
  { id: "trasferimenti-extra-ue", label: "Trasferimenti extra-UE" },
  { id: "cancellazione-restituzione", label: "Cancellazione o restituzione dei dati" },
  { id: "responsabilita-durata", label: "Responsabilità e durata dell'accordo" },
];

export default function DpaPage() {
  return (
    <LegalPage
      title="Data Processing Agreement (Nomina a Responsabile del Trattamento)"
      updatedAt="5 settembre 2026"
      toc={TOC}
    >
      <LegalSection id="premessa" title="1. Premessa e ambito di applicazione">
        <p>
          Il presente accordo (&quot;DPA&quot;), stipulato ai sensi dell&apos;art. 28 del Regolamento (UE)
          2016/679 (&quot;GDPR&quot;), integra e forma parte inscindibile dei Termini e Condizioni di Servizio
          RecoverPulse, e disciplina il trattamento dei dati personali che RecoverPulse effettua per conto del
          Merchant nell&apos;ambito dell&apos;erogazione del Servizio. In caso di conflitto tra il presente DPA
          e i Termini, in relazione al trattamento dei dati personali, prevale il presente DPA.
        </p>
      </LegalSection>

      <LegalSection id="definizioni" title="2. Definizioni">
        <p>
          I termini &quot;dato personale&quot;, &quot;trattamento&quot;, &quot;titolare del trattamento&quot;,
          &quot;responsabile del trattamento&quot;, &quot;interessato&quot;, &quot;violazione dei dati
          personali&quot; e &quot;sub-responsabile del trattamento&quot; hanno il significato loro attribuito
          dall&apos;art. 4 del GDPR.
        </p>
      </LegalSection>

      <LegalSection id="ruoli" title="3. Ruoli delle parti">
        <p>Le parti riconoscono e stabiliscono che, in relazione ai dati personali trattati tramite il Servizio:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            il <strong>Merchant</strong> agisce quale <strong>Titolare del Trattamento (Data Controller)</strong>,
            in quanto determina le finalità e i mezzi essenziali del trattamento dei dati personali dei propri
            Clienti Finali;
          </li>
          <li>
            <strong>RecoverPulse</strong> agisce quale <strong>Responsabile del Trattamento (Data
            Processor)</strong>, trattando i dati personali esclusivamente per conto e secondo le istruzioni
            documentate del Merchant, nei limiti e per le finalità previste dal presente DPA.
          </li>
        </ul>
        <p>
          Resta inteso che, per i dati personali relativi al Merchant medesimo raccolti in fase di registrazione
          e gestione dell&apos;account (es. dati dei referenti aziendali), RecoverPulse agisce quale autonomo
          titolare del trattamento, come descritto nella{" "}
          <a href="/privacy" className="text-emerald-400 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="oggetto-durata" title="4. Oggetto, natura e durata del trattamento">
        <p>
          RecoverPulse tratta i dati personali dei Clienti Finali del Merchant esclusivamente per individuare i
          pagamenti Stripe non andati a buon fine, generare e inviare le comunicazioni di sollecito (dunning)
          configurate dal Merchant e rendere disponibile il portale self-service di aggiornamento del metodo di
          pagamento. Il trattamento ha natura automatizzata (rilevazione di eventi webhook, generazione e invio
          di comunicazioni, archiviazione di log) e ha durata pari alla durata del contratto di Servizio in
          essere tra RecoverPulse e il Merchant, fatto salvo quanto previsto all&apos;art. 15.
        </p>
      </LegalSection>

      <LegalSection id="categorie-dati" title="5. Categorie di interessati e di dati">
        <p>
          <strong>Interessati:</strong> i Clienti Finali del Merchant i cui abbonamenti/pagamenti ricorrenti sono
          gestiti tramite Stripe e collegati al Servizio.
        </p>
        <p><strong>Categorie di dati personali trattati:</strong></p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>dati identificativi e di contatto (nome, cognome, indirizzo email);</li>
          <li>
            dati relativi al pagamento fallito (importo insoluto, valuta, causale, data e stato del tentativo di
            addebito, identificativo dell&apos;abbonamento/subscription ID Stripe);
          </li>
          <li>
            dati tecnici di interazione con le comunicazioni inviate (es. apertura, click sul link di
            aggiornamento del metodo di pagamento), nella misura resa disponibile dal fornitore di invio email.
          </li>
        </ul>
        <p>
          Non sono trattati, nell&apos;ambito del Servizio, dati relativi a strumenti di pagamento (numeri di
          carta, IBAN) né categorie particolari di dati ai sensi dell&apos;art. 9 GDPR: tali dati restano
          gestiti esclusivamente da Stripe secondo i propri standard di sicurezza (PCI-DSS).
        </p>
      </LegalSection>

      <LegalSection id="istruzioni" title="6. Istruzioni documentate del Titolare">
        <p>
          RecoverPulse tratta i dati personali unicamente sulla base di istruzioni documentate impartite dal
          Merchant, anche tramite le impostazioni della dashboard (es. regole di sollecito, canali attivi,
          contenuto dei template email) e i presenti Termini. Qualora RecoverPulse ritenga che un&apos;istruzione
          impartita dal Merchant violi il GDPR o altre disposizioni relative alla protezione dei dati, ne informa
          immediatamente il Merchant, fermo restando il diritto di sospendere l&apos;esecuzione
          dell&apos;istruzione contestata fino a chiarimento.
        </p>
      </LegalSection>

      <LegalSection id="obblighi-responsabile" title="7. Obblighi del Responsabile del Trattamento">
        <p>RecoverPulse, in qualità di Responsabile del Trattamento, si impegna a:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>trattare i dati personali esclusivamente per le finalità e secondo le istruzioni di cui al presente DPA;</li>
          <li>garantire che il personale autorizzato al trattamento sia vincolato da obblighi di riservatezza;</li>
          <li>adottare le misure di sicurezza tecniche e organizzative di cui all&apos;art. 9;</li>
          <li>rispettare le condizioni previste dal presente DPA per il ricorso a sub-responsabili;</li>
          <li>assistere il Titolare secondo quanto previsto all&apos;art. 11;</li>
          <li>mettere a disposizione del Titolare le informazioni necessarie a dimostrare il rispetto degli obblighi di cui all&apos;art. 28 GDPR e a consentire/contribuire alle attività di audit di cui all&apos;art. 13;</li>
          <li>cancellare o restituire i dati personali al termine del rapporto, secondo quanto previsto all&apos;art. 15.</li>
        </ul>
      </LegalSection>

      <LegalSection id="riservatezza-personale" title="8. Riservatezza del personale">
        <p>
          RecoverPulse garantisce che le persone autorizzate al trattamento dei dati personali si siano
          impegnate a rispettare la riservatezza o siano soggette a un adeguato obbligo di riservatezza legale, e
          che l&apos;accesso ai dati sia limitato al personale per il quale tale accesso sia strettamente
          necessario allo svolgimento delle proprie mansioni.
        </p>
      </LegalSection>

      <LegalSection id="misure-sicurezza" title="9. Misure di sicurezza (art. 32 GDPR)">
        <p>
          RecoverPulse adotta misure tecniche e organizzative adeguate a garantire un livello di sicurezza
          adeguato al rischio, tra cui in particolare:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>cifratura dei dati in transito (TLS) e a riposo, ove tecnicamente supportata dai Sub-fornitori infrastrutturali;</li>
          <li>controllo degli accessi basato su autenticazione e limitazione dei privilegi al personale autorizzato;</li>
          <li>segregazione logica dei dati tra i diversi account Merchant;</li>
          <li>monitoraggio e logging degli accessi ai sistemi che trattano dati personali;</li>
          <li>procedure di gestione degli incidenti di sicurezza e dei Data Breach di cui all&apos;art. 12;</li>
          <li>backup periodici e procedure di ripristino della disponibilità dei dati in caso di incidente fisico o tecnico.</li>
        </ul>
      </LegalSection>

      <LegalSection id="sub-responsabili" title="10. Sub-responsabili autorizzati">
        <p>
          Il Titolare autorizza in via generale RecoverPulse al ricorso ai seguenti Sub-responsabili per
          l&apos;erogazione del Servizio:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Stripe, Inc.</strong> — elaborazione dei pagamenti e sorgente dati sui pagamenti falliti;</li>
          <li><strong>Resend, Inc.</strong> — invio delle comunicazioni email transazionali di dunning;</li>
          <li><strong>Supabase, Inc.</strong> — infrastruttura di archiviazione e gestione del database;</li>
          <li><strong>Vercel, Inc.</strong> — hosting dell&apos;applicazione ed esecuzione delle funzioni automatizzate (incluso il cron di dunning);</li>
        </ul>
        <p>
          RecoverPulse garantisce che ciascun Sub-responsabile sia vincolato, mediante accordo scritto, a
          obblighi in materia di protezione dei dati non meno stringenti di quelli previsti dal presente DPA.
          RecoverPulse resta pienamente responsabile nei confronti del Titolare per l&apos;adempimento degli
          obblighi dei Sub-responsabili. RecoverPulse informerà il Merchant di eventuali modifiche riguardanti
          l&apos;aggiunta o la sostituzione di Sub-responsabili, dando al Merchant la possibilità di opporsi per
          motivate ragioni connesse alla protezione dei dati.
        </p>
      </LegalSection>

      <LegalSection id="assistenza-titolare" title="11. Assistenza al Titolare">
        <p>
          Tenuto conto della natura del trattamento e delle informazioni a disposizione, RecoverPulse assiste il
          Titolare, mediante misure tecniche e organizzative adeguate e nei limiti delle proprie possibilità
          tecniche, nel:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>rispondere alle richieste di esercizio dei diritti degli interessati (accesso, rettifica, cancellazione, limitazione, portabilità, opposizione);</li>
          <li>garantire il rispetto degli obblighi relativi alla sicurezza del trattamento (art. 32 GDPR);</li>
          <li>notificare le violazioni dei dati personali all&apos;Autorità di controllo e agli interessati, ove applicabile;</li>
          <li>effettuare valutazioni d&apos;impatto sulla protezione dei dati (DPIA) e le eventuali consultazioni preventive con l&apos;Autorità di controllo.</li>
        </ul>
      </LegalSection>

      <LegalSection id="data-breach" title="12. Gestione dei Data Breach">
        <p>
          In caso di violazione dei dati personali trattati per conto del Titolare, RecoverPulse ne dà
          comunicazione al Titolare <strong>senza ingiustificato ritardo</strong> e comunque non oltre
          <strong> 48 (quarantotto) ore</strong> dal momento in cui ne è venuta a conoscenza, fornendo, nella
          misura in cui le informazioni siano disponibili: natura della violazione, categorie e numero
          approssimativo di interessati e di record coinvolti, conseguenze probabili e misure adottate o
          proposte per porvi rimedio e attenuarne i possibili effetti negativi. Resta inteso che spetta al
          Titolare, in qualità di titolare del trattamento, valutare l&apos;obbligo di notifica
          all&apos;Autorità Garante e agli interessati ai sensi degli artt. 33 e 34 GDPR.
        </p>
      </LegalSection>

      <LegalSection id="audit" title="13. Verifiche e audit">
        <p>
          RecoverPulse mette a disposizione del Titolare, su richiesta scritta e con ragionevole preavviso non
          inferiore a 30 giorni, le informazioni necessarie a dimostrare il rispetto degli obblighi previsti dal
          presente DPA, e consente e contribuisce alle attività di revisione, comprese le ispezioni, condotte dal
          Titolare o da un revisore da questi incaricato, con oneri a carico del Titolare, salvo che
          l&apos;audit rilevi una violazione sostanziale del presente DPA imputabile a RecoverPulse.
        </p>
      </LegalSection>

      <LegalSection id="trasferimenti-extra-ue" title="14. Trasferimenti extra-UE">
        <p>
          Alcuni Sub-responsabili di cui all&apos;art. 10 possono trattare i dati personali anche al di fuori
          dello Spazio Economico Europeo. In tali casi, RecoverPulse garantisce che il trasferimento avvenga sulla
          base di una decisione di adeguatezza della Commissione Europea, di Clausole Contrattuali Standard
          approvate dalla Commissione Europea, o di altro strumento di trasferimento riconosciuto idoneo ai sensi
          del Capo V del GDPR.
        </p>
      </LegalSection>

      <LegalSection id="cancellazione-restituzione" title="15. Cancellazione o restituzione dei dati">
        <p>
          Alla cessazione del Servizio, per qualsiasi causa, RecoverPulse cancella o, su richiesta del Titolare
          formulata entro 30 giorni dalla cessazione, restituisce al Titolare tutti i dati personali trattati per
          suo conto, cancellando le copie esistenti, salvo che la conservazione dei dati sia richiesta dal diritto
          dell&apos;Unione o degli Stati membri applicabile a RecoverPulse (es. obblighi fiscali, contabili o di
          difesa in giudizio), nel qual caso i dati saranno conservati esclusivamente per tale finalità e per il
          relativo periodo, mantenendo riservatezza e adottando le misure di sicurezza di cui all&apos;art. 9.
        </p>
      </LegalSection>

      <LegalSection id="responsabilita-durata" title="16. Responsabilità e durata dell'accordo">
        <p>
          Il presente DPA ha efficacia per tutta la durata del contratto di Servizio ed è automaticamente
          risolto alla cessazione dello stesso, fermo restando quanto previsto all&apos;art. 15. La
          responsabilità delle parti in relazione al trattamento dei dati personali resta disciplinata dal GDPR
          e, nei limiti consentiti dalla normativa inderogabile applicabile, dalla clausola di limitazione di
          responsabilità prevista nei Termini e Condizioni di Servizio.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
