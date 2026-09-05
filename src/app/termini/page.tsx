import { LegalPage, LegalSection, LegalSubsection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Termini e Condizioni di Servizio — RecoverPulse",
};

const TOC = [
  { id: "definizioni", label: "Definizioni" },
  { id: "oggetto-natura", label: "Oggetto e natura del Servizio" },
  { id: "manleva", label: "Manleva e Garanzia sui Crediti" },
  { id: "limitazione-responsabilita", label: "Limite Massimo di Responsabilità" },
  { id: "assenza-garanzia", label: "Assenza di garanzia di risultato" },
  { id: "aup", label: "Acceptable Use Policy e Sospensione Immediata Senza Rimborso" },
  { id: "servizi-terzi", label: "Dipendenza da servizi di terze parti" },
  { id: "proprieta-riservatezza", label: "Proprietà intellettuale e riservatezza" },
  { id: "legge-foro", label: "Legge applicabile e Foro Competente Esclusivo" },
  { id: "account", label: "Account, registrazione e prova gratuita" },
  { id: "obblighi-merchant", label: "Obblighi e dichiarazioni del Merchant" },
  { id: "corrispettivi", label: "Corrispettivi, fatturazione e recesso" },
  { id: "durata-risoluzione", label: "Durata, recesso e risoluzione" },
  { id: "modifiche", label: "Modifiche ai Termini" },
  { id: "disposizioni-finali", label: "Disposizioni finali" },
];

export default function TerminiPage() {
  return (
    <LegalPage title="Termini e Condizioni di Servizio" updatedAt="5 settembre 2026" toc={TOC}>
      <LegalSection id="definizioni" title="1. Definizioni">
        <p>Ai fini del presente documento (i &quot;Termini&quot;), i seguenti termini assumono il significato indicato:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>&quot;Servizio&quot;</strong>: la piattaforma software-as-a-service RecoverPulse, incluse la
            dashboard web, le API, gli script di dunning automatico e il portale self-service di aggiornamento
            del metodo di pagamento.
          </li>
          <li>
            <strong>&quot;RecoverPulse&quot;, &quot;noi&quot;</strong>: il fornitore del Servizio, come identificato
            nei dati societari pubblicati in calce al presente documento.
          </li>
          <li>
            <strong>&quot;Merchant&quot;, &quot;Cliente&quot;, &quot;tu&quot;</strong>: il soggetto, persona
            giuridica o professionista che sottoscrive un account RecoverPulse per uso esclusivamente
            professionale/aziendale.
          </li>
          <li>
            <strong>&quot;Cliente Finale&quot;</strong>: il soggetto terzo, cliente del Merchant, i cui dati di
            pagamento sono trattati tramite Stripe e verso il quale il Servizio invia comunicazioni di
            sollecito per conto del Merchant.
          </li>
          <li>
            <strong>&quot;Contenuti del Merchant&quot;</strong>: i dati, i template email, i loghi, i testi e le
            regole di dunning caricati o configurati dal Merchant nel Servizio.
          </li>
          <li>
            <strong>&quot;Sub-fornitori&quot;</strong>: i fornitori tecnologici terzi di cui RecoverPulse si
            avvale per l&apos;erogazione del Servizio (a titolo esemplificativo Stripe, Resend, Supabase,
            Vercel/AWS).
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="oggetto-natura" title="2. Oggetto e natura del Servizio">
        <p>
          RecoverPulse è uno strumento software di automazione delle notifiche (&quot;dunning management&quot;)
          che si collega, tramite le API ufficiali di Stripe autorizzate dal Merchant, ai pagamenti ricorrenti
          falliti (&quot;involuntary churn&quot;) e genera in modo automatizzato sequenze di comunicazione
          multi-canale (email e, ove attivati, canali aggiuntivi) rivolte al Cliente Finale, oltre a un portale
          self-service per l&apos;aggiornamento del metodo di pagamento associato all&apos;abbonamento.
        </p>
        <p>
          Il Servizio ha natura di <strong>strumento tecnologico di supporto amministrativo e commerciale</strong>{" "}
          messo a disposizione del Merchant. RecoverPulse:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            non agisce in nome o per conto del Merchant nella negoziazione, transazione o riscossione di crediti
            nei confronti del Cliente Finale;
          </li>
          <li>
            non svolge attività di recupero crediti stragiudiziale né alcuna attività riconducibile
            all&apos;esercizio di agenzia di recupero crediti ai sensi dell&apos;art. 115 del R.D. 18 giugno
            1931, n. 773 (TULPS) e successive modificazioni, e non è titolare della relativa licenza prefettizia;
          </li>
          <li>
            non entra mai in possesso di somme di denaro del Cliente Finale: ogni transazione, incasso e
            movimentazione di fondi avviene esclusivamente tramite l&apos;infrastruttura di pagamento di Stripe,
            titolare del rapporto di elaborazione pagamenti con il Merchant;
          </li>
          <li>
            si limita a rilevare lo stato del pagamento tramite webhook Stripe e a inviare comunicazioni
            informative/di cortesia predisposte o approvate dal Merchant.
          </li>
        </ul>
        <p>
          Qualunque riferimento nel Servizio a termini quali &quot;recupero&quot;, &quot;sollecito&quot; o
          &quot;dunning&quot; deve intendersi come riferito esclusivamente a tale attività di notifica
          automatizzata e non implica, in alcun caso, l&apos;assunzione da parte di RecoverPulse del ruolo di
          creditore, mandatario alla riscossione o agente di recupero crediti.
        </p>

        <LegalSubsection title="2.1 Ambito B2B e accettazione">
          <p>
            Il Servizio è offerto <strong>esclusivamente a soggetti che agiscono nell&apos;esercizio di
            un&apos;attività imprenditoriale, commerciale, artigianale o professionale</strong>
            (rapporto Business-to-Business). Registrandosi al Servizio, il Merchant dichiara e garantisce di non
            agire come consumatore ai sensi dell&apos;art. 3, comma 1, lett. a) del Codice del Consumo (D.Lgs.
            206/2005) e che le tutele previste per i contratti B2C non trovano applicazione al presente
            rapporto contrattuale.
          </p>
          <p>
            L&apos;accesso e l&apos;utilizzo del Servizio, anche in fase di prova gratuita, comportano
            l&apos;integrale accettazione dei presenti Termini. Se il Merchant non accetta integralmente i
            Termini, non è autorizzato ad accedere o utilizzare il Servizio.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection id="manleva" title="3. Manleva e Garanzia sui Crediti">
        <p>
          Il Merchant garantisce la piena legittimità, esistenza ed esigibilità dei crediti sottostanti alle
          comunicazioni di dunning inviate tramite il Servizio, e si obbliga a tenere indenne e manlevare
          RecoverPulse, i suoi amministratori, dipendenti e collaboratori, da qualsiasi pretesa, richiesta,
          azione legale, danno, sanzione, costo o spesa (incluse le ragionevoli spese legali) derivante da o
          connessa a:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            la mancanza di titolo, legittimità, esistenza o esigibilità dei crediti sottostanti alle
            comunicazioni di dunning inviate tramite il Servizio;
          </li>
          <li>
            pretese avanzate da Clienti Finali o da terzi in relazione ai contenuti, alla frequenza o alle
            modalità delle comunicazioni configurate o approvate dal Merchant;
          </li>
          <li>
            la violazione da parte del Merchant dei presenti Termini, della normativa applicabile o di diritti
            di terzi (inclusa la normativa sulla protezione dei dati personali riferita ai Clienti Finali);
          </li>
          <li>
            l&apos;uso improprio, fraudolento o non autorizzato del Servizio da parte del Merchant o di soggetti
            che accedono all&apos;account con le sue credenziali.
          </li>
        </ul>
        <p>Tale obbligo di manleva sopravvive alla cessazione, per qualsiasi causa, del rapporto contrattuale.</p>
      </LegalSection>

      <LegalSection id="limitazione-responsabilita" title="4. Limite Massimo di Responsabilità">
        <p>
          Nella misura massima consentita dalla legge applicabile, la responsabilità complessiva di
          RecoverPulse nei confronti del Merchant, per qualsiasi causa e a qualsiasi titolo (contrattuale,
          precontrattuale o extracontrattuale) derivante da o connessa all&apos;utilizzo del Servizio, è
          <strong> limitata all&apos;importo complessivo effettivamente versato dal Merchant a RecoverPulse a
          titolo di canone di abbonamento nei dodici (12) mesi immediatamente precedenti l&apos;evento che ha
          generato la pretesa risarcitoria</strong>.
        </p>
        <p>
          In nessun caso RecoverPulse sarà responsabile nei confronti del Merchant per danni indiretti,
          consequenziali, incidentali, punitivi o esemplari, incluse a titolo esemplificativo e non esaustivo
          <strong> perdita di profitto, mancato guadagno, lucro cessante, perdita di avviamento, perdita di dati
          o interruzione di attività</strong>, anche qualora RecoverPulse fosse stata informata della possibilità
          del verificarsi di tali danni.
        </p>
        <p>
          Le limitazioni di cui al presente articolo non si applicano nei casi in cui la responsabilità non
          possa essere validamente limitata o esclusa ai sensi di norme inderogabili di legge, incluso il caso di
          dolo o colpa grave di RecoverPulse.
        </p>
      </LegalSection>

      <LegalSection id="assenza-garanzia" title="5. Assenza di garanzia di risultato">
        <p>
          Il Servizio è fornito secondo il principio del <strong>miglior sforzo tecnologico
          (&quot;best effort&quot;)</strong>. RecoverPulse non garantisce, in alcuna forma, il recupero di uno
          specifico importo, percentuale di fatturato, tasso di conversione o esito positivo delle comunicazioni
          di sollecito inviate ai Clienti Finali.
        </p>
        <p>
          L&apos;efficacia del Servizio dipende da fattori esulanti dal controllo di RecoverPulse, tra cui: la
          solvibilità e reattività del Cliente Finale, la deliverability delle comunicazioni presso terzi
          gestori di posta elettronica, l&apos;affidabilità e la disponibilità delle infrastrutture dei
          Sub-fornitori, e la correttezza delle regole di dunning configurate dal Merchant. Il Servizio è fornito
          &quot;così com&apos;è&quot; (&quot;as is&quot;) e &quot;in base alla disponibilità&quot;
          (&quot;as available&quot;), senza garanzie di alcun tipo, esplicite o implicite, incluse a titolo
          esemplificativo le garanzie di idoneità a uno scopo particolare, non violazione e continuità operativa
          ininterrotta.
        </p>
      </LegalSection>

      <LegalSection id="aup" title="6. Acceptable Use Policy e Sospensione Immediata Senza Rimborso">
        <p>
          Utilizzando il Servizio, il Merchant si impegna a non utilizzarlo, direttamente o tramite terzi, per
          finalità illecite o non autorizzate. È in particolare espressamente vietato:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>inviare comunicazioni di spam, non sollecitate o in violazione della normativa anti-spam applicabile;</li>
          <li>
            utilizzare il Servizio per finalità di phishing, social engineering, furto di credenziali o dati
            finanziari, o per veicolare contenuti fraudolenti, ingannevoli o minatori;
          </li>
          <li>
            inviare comunicazioni relative a crediti inesistenti, contestati, prescritti o comunque non
            legittimamente dovuti;
          </li>
          <li>
            tentare di eludere, sovraccaricare o compromettere la sicurezza, l&apos;integrità o la disponibilità
            del Servizio o delle infrastrutture dei Sub-fornitori;
          </li>
          <li>
            utilizzare il Servizio in violazione di qualsiasi legge, regolamento o diritto di terzi, incluse la
            normativa sulla protezione dei dati personali e sulle comunicazioni commerciali.
          </li>
        </ul>
        <p>
          In caso di violazione, anche solo sospetta e non definitivamente accertata, della presente AUP,
          RecoverPulse si riserva il diritto di <strong>sospendere o disattivare immediatamente</strong>, senza
          preavviso, l&apos;account del Merchant e/o specifiche funzionalità del Servizio, <strong>senza
          obbligo di rimborso</strong> degli importi già corrisposti, fatto salvo il diritto di RecoverPulse al
          risarcimento dell&apos;eventuale maggior danno subito.
        </p>
      </LegalSection>

      <LegalSection id="servizi-terzi" title="7. Dipendenza da servizi di terze parti">
        <p>
          L&apos;erogazione del Servizio dipende dal corretto funzionamento di infrastrutture e API gestite da
          soggetti terzi, tra cui in particolare:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Stripe, Inc.</strong> — elaborazione dei pagamenti e fonte dei dati relativi ai pagamenti falliti;</li>
          <li><strong>Resend, Inc.</strong> — infrastruttura di invio delle comunicazioni email transazionali;</li>
          <li><strong>Supabase, Inc.</strong> — infrastruttura di archiviazione dati;</li>
          <li><strong>Vercel, Inc. / Amazon Web Services (AWS)</strong> — infrastruttura di hosting, calcolo e rete.</li>
        </ul>
        <p>
          RecoverPulse non garantisce, e non può essere ritenuta responsabile per, interruzioni,
          malfunzionamenti, ritardi, modifiche unilaterali alle API, indisponibilità di rete o qualsiasi altro
          disservizio originato da tali Sub-fornitori o da altre infrastrutture di rete/Internet non gestite
          direttamente da RecoverPulse. In caso di disservizio di un Sub-fornitore, RecoverPulse si impegna ad
          adoperarsi secondo il principio del miglior sforzo per ripristinare la piena operatività del Servizio
          nei tempi tecnicamente ragionevoli.
        </p>
      </LegalSection>

      <LegalSection id="proprieta-riservatezza" title="8. Proprietà intellettuale e riservatezza">
        <LegalSubsection title="8.1 Proprietà intellettuale">
          <p>
            Il Servizio, il relativo software, l&apos;interfaccia, i marchi, i loghi e ogni altro elemento
            distintivo sono di proprietà esclusiva di RecoverPulse o dei rispettivi licenzianti e sono protetti
            dalla normativa applicabile in materia di proprietà intellettuale. Al Merchant è concessa una licenza
            d&apos;uso limitata, non esclusiva, non trasferibile e revocabile, limitata alla durata
            dell&apos;abbonamento e finalizzata al solo utilizzo del Servizio secondo i presenti Termini.
          </p>
          <p>
            I Contenuti del Merchant restano di proprietà del Merchant, che concede a RecoverPulse una licenza
            limitata a trattarli nella misura strettamente necessaria a erogare il Servizio.
          </p>
        </LegalSubsection>
        <LegalSubsection title="8.2 Riservatezza">
          <p>
            Ciascuna parte si impegna a mantenere riservate le informazioni di natura tecnica, commerciale o
            organizzativa dell&apos;altra parte di cui venga a conoscenza in esecuzione del presente contratto, e a
            non divulgarle a terzi né utilizzarle per finalità diverse dall&apos;esecuzione del rapporto
            contrattuale, salvo quanto diversamente previsto dalla legge o da provvedimento dell&apos;autorità
            competente.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection id="legge-foro" title="9. Legge applicabile e Foro Competente Esclusivo">
        <p>
          I presenti Termini sono regolati e interpretati in conformità alla <strong>legge italiana</strong>, con
          esclusione delle norme di conflitto e della Convenzione delle Nazioni Unite sui contratti di vendita
          internazionale di merci, ove applicabile.
        </p>
        <p>
          Trattandosi di rapporto tra soggetti che agiscono nell&apos;esercizio della propria attività
          professionale o imprenditoriale (B2B), per qualsiasi controversia relativa alla validità,
          interpretazione, esecuzione o risoluzione dei presenti Termini è competente, in via
          <strong> esclusiva</strong>, il <strong>Foro del luogo in cui RecoverPulse ha la propria sede
          legale</strong>, con espressa esclusione di qualsiasi altro foro concorrente eventualmente
          applicabile.
        </p>
      </LegalSection>

      <LegalSection id="account" title="10. Account, registrazione e prova gratuita">
        <p>
          L&apos;attivazione avviene tramite registrazione self-serve su <code>/start-trial</code>, con un
          periodo di prova gratuita di 14 giorni senza necessità di carta di credito. Al termine della prova,
          l&apos;accesso alle funzionalità avanzate richiede la sottoscrizione di uno dei piani a pagamento
          indicati in <code>/#pricing</code>.
        </p>
        <p>
          Il Merchant è responsabile della riservatezza delle proprie credenziali di accesso e di ogni attività
          svolta tramite il proprio account. RecoverPulse non è responsabile per accessi non autorizzati
          derivanti da negligenza del Merchant nella custodia delle credenziali.
        </p>
      </LegalSection>

      <LegalSection id="obblighi-merchant" title="11. Obblighi e dichiarazioni del Merchant">
        <p>Il Merchant dichiara e garantisce, per l&apos;intera durata del rapporto contrattuale, quanto segue:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            di avere pieno titolo per collegare il proprio account Stripe al Servizio e di essere l&apos;unico
            responsabile della legittimità, esistenza ed esigibilità dei crediti sottostanti ai pagamenti
            falliti oggetto delle comunicazioni di dunning;
          </li>
          <li>
            di essere responsabile dell&apos;accuratezza dei dati aziendali forniti (ragione sociale, Partita
            IVA/Codice Fiscale, indirizzo di sede legale) in fase di registrazione e nelle Impostazioni
            dell&apos;account, e di tenerli costantemente aggiornati;
          </li>
          <li>
            di avere ottenuto, ove necessario in base al rapporto con i propri Clienti Finali, ogni consenso o
            base giuridica idonea per l&apos;invio delle comunicazioni automatizzate generate tramite il
            Servizio;
          </li>
          <li>
            di configurare correttamente le regole di dunning, i canali attivi e i template di comunicazione, e
            di verificarne preventivamente contenuto e conformità normativa prima dell&apos;attivazione;
          </li>
          <li>
            di utilizzare il Servizio in conformità alla normativa applicabile, inclusa quella in materia di
            protezione dei dati personali, comunicazioni commerciali e tutela del consumatore nei rapporti con i
            propri Clienti Finali.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="corrispettivi" title="12. Corrispettivi, fatturazione e recesso">
        <p>
          I piani sono fatturati mensilmente tramite Stripe agli importi indicati nella pagina Prezzi al momento
          della sottoscrizione o del successivo rinnovo. Il Merchant può annullare l&apos;abbonamento in
          qualsiasi momento dalle Impostazioni della dashboard, senza vincoli di durata minima; la disdetta ha
          effetto al termine del periodo di fatturazione in corso, salvo diversa indicazione contrattuale.
        </p>
        <p>
          Gli importi corrisposti non sono rimborsabili, salvo quanto diversamente previsto dalla legge
          inderogabile applicabile o espressamente concordato per iscritto tra le parti.
        </p>
      </LegalSection>

      <LegalSection id="durata-risoluzione" title="13. Durata, recesso e risoluzione">
        <p>
          Il contratto ha durata pari al periodo di fatturazione dell&apos;abbonamento selezionato e si rinnova
          automaticamente per periodi successivi di pari durata, salvo disdetta comunicata dal Merchant tramite
          le Impostazioni della dashboard.
        </p>
        <p>
          RecoverPulse può risolvere il contratto con effetto immediato, mediante semplice comunicazione,
          in caso di violazione grave o reiterata dei presenti Termini da parte del Merchant, incluse le
          violazioni dell&apos;AUP di cui all&apos;art. 6, o in caso di mancato pagamento del corrispettivo
          dovuto.
        </p>
      </LegalSection>

      <LegalSection id="modifiche" title="14. Modifiche ai Termini">
        <p>
          RecoverPulse può modificare i presenti Termini in qualsiasi momento, dandone comunicazione al Merchant
          con ragionevole anticipo tramite la dashboard o l&apos;indirizzo email associato all&apos;account. La
          prosecuzione nell&apos;utilizzo del Servizio successivamente all&apos;entrata in vigore delle modifiche
          costituisce accettazione delle stesse.
        </p>
      </LegalSection>

      <LegalSection id="disposizioni-finali" title="15. Disposizioni finali">
        <LegalSubsection title="15.1 Intero accordo">
          <p>
            I presenti Termini, unitamente al DPA e alla Privacy Policy richiamati, costituiscono l&apos;intero
            accordo tra le parti in relazione al Servizio e sostituiscono ogni precedente intesa, scritta o
            orale, avente il medesimo oggetto.
          </p>
        </LegalSubsection>
        <LegalSubsection title="15.2 Clausola di salvaguardia">
          <p>
            Qualora una o più disposizioni dei presenti Termini fossero dichiarate invalide o inefficaci, ciò
            non pregiudicherà la validità delle restanti disposizioni, che rimarranno pienamente efficaci.
          </p>
        </LegalSubsection>
        <LegalSubsection title="15.3 Cessione">
          <p>
            Il Merchant non può cedere il presente contratto, in tutto o in parte, senza il preventivo consenso
            scritto di RecoverPulse. RecoverPulse può cedere il contratto, anche parzialmente, nell&apos;ambito
            di operazioni societarie straordinarie (fusione, acquisizione, cessione di ramo d&apos;azienda).
          </p>
        </LegalSubsection>
        <LegalSubsection title="15.4 Trattamento dei dati">
          <p>
            Il trattamento dei dati personali dei Clienti Finali del Merchant, effettuato da RecoverPulse in
            qualità di responsabile del trattamento, è disciplinato dalla{" "}
            <a href="/dpa" className="text-emerald-400 hover:underline">
              Nomina a Responsabile del Trattamento (DPA)
            </a>{" "}
            e dalla{" "}
            <a href="/privacy" className="text-emerald-400 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </LegalSubsection>
      </LegalSection>
    </LegalPage>
  );
}
