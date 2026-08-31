export type DunningTemplateStepId = "immediate" | "first_reminder" | "final_notice";

export type DunningTemplateStep = {
  id: DunningTemplateStepId;
  label: string;
  description: string;
  enabled: boolean;
  /** Giorni di attesa dopo il pagamento fallito. 0 per il sollecito immediato. */
  delayDays: number;
  subject: string;
  body: string;
};

export type DunningTemplatesSettings = {
  automationEnabled: boolean;
  steps: DunningTemplateStep[];
};

export type DunningTemplateVariables = {
  nome_cliente: string;
  importo: string;
  nome_piano: string;
  nome_azienda: string;
  link_recupero: string;
};

/**
 * Sostituisce i placeholder {{variabile}} di un template configurato in
 * /dashboard/dunning (oggetto o corpo email) con i valori reali della
 * fattura. Un placeholder senza un valore noto viene lasciato invariato
 * invece di sparire silenziosamente, così un typo nel nome della variabile
 * resta visibile nell'anteprima/nell'email inviata.
 */
export function renderDunningTemplate(template: string, vars: DunningTemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in vars ? vars[key as keyof DunningTemplateVariables] : match
  );
}

const VARIABLE_PLACEHOLDER_BODY = (label: string) =>
  `Ciao {{nome_cliente}},\n\n${label} Il pagamento di {{importo}} per {{nome_piano}} non è ancora andato a buon fine.\n\nAggiorna il tuo metodo di pagamento qui:\n{{link_recupero}}\n\nGrazie,\nIl team`;

function defaultSteps(): DunningTemplateStep[] {
  return [
    {
      id: "immediate",
      label: "Sollecito Immediato",
      description: "Inviato subito dopo il primo fallimento di pagamento.",
      enabled: true,
      delayDays: 0,
      subject: "Il pagamento per {{nome_piano}} non è andato a buon fine",
      body: VARIABLE_PLACEHOLDER_BODY("Abbiamo riscontrato un problema con il tuo ultimo pagamento."),
    },
    {
      id: "first_reminder",
      label: "Primo Reminder",
      description: "Ritardo personalizzabile: es. 3 giorni dopo.",
      enabled: true,
      delayDays: 3,
      subject: "Promemoria: {{nome_piano}} in attesa di pagamento",
      body: VARIABLE_PLACEHOLDER_BODY("Questo è un promemoria: il tuo abbonamento è ancora sospeso."),
    },
    {
      id: "final_notice",
      label: "Ultimo Avviso",
      description: "Ritardo personalizzabile: es. 7 giorni dopo.",
      enabled: true,
      delayDays: 7,
      subject: "Importante: Aggiorna il tuo metodo di pagamento per {{nome_azienda}}",
      body: VARIABLE_PLACEHOLDER_BODY(
        "Questo è l'ultimo avviso prima della sospensione dell'abbonamento."
      ),
    },
  ];
}

function defaultSettings(): DunningTemplatesSettings {
  return { automationEnabled: true, steps: defaultSteps() };
}

declare global {
  var __recoverpulseDunningTemplates: DunningTemplatesSettings | undefined;
}

// Store in-memory demo, stesso pattern di src/lib/dunning-settings.ts: sopravvive
// ai reload del dev server grazie a `globalThis`, ma va sostituito con una tabella
// Supabase prima della produzione.
const settings = globalThis.__recoverpulseDunningTemplates ?? defaultSettings();
if (process.env.NODE_ENV !== "production") {
  globalThis.__recoverpulseDunningTemplates = settings;
}

export function getDunningTemplates(): DunningTemplatesSettings {
  return settings;
}

export function updateDunningTemplates(next: DunningTemplatesSettings): DunningTemplatesSettings {
  settings.automationEnabled = next.automationEnabled;
  settings.steps = next.steps.map((step) => ({ ...step }));
  return settings;
}
