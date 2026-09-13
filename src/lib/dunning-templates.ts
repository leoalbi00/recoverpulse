import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { renderDunningTemplate, type DunningTemplateVariables } from "@/lib/template-variables";

export { renderDunningTemplate, type DunningTemplateVariables };

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

// label/description sono testo descrittivo mostrato in dashboard ma mai
// modificabile dall'editor (nessun input per questi campi in
// dunning-templates-manager.tsx): restano hardcoded qui invece che duplicati
// su Supabase, per non trattare come "dato" un testo di UI immutabile.
const STEP_METADATA: Record<DunningTemplateStepId, { label: string; description: string }> = {
  immediate: {
    label: "Primo Sollecito",
    description: "Innescato subito dopo il fallimento del pagamento.",
  },
  first_reminder: {
    label: "Secondo Sollecito",
    description: "Ritardo personalizzabile: es. 3 giorni dopo.",
  },
  final_notice: {
    label: "Ultimo Avviso",
    description: "Ritardo personalizzabile: es. 7 giorni dopo.",
  },
};

const STEP_ORDER: DunningTemplateStepId[] = ["immediate", "first_reminder", "final_notice"];

function defaultSteps(): DunningTemplateStep[] {
  return [
    {
      id: "immediate",
      ...STEP_METADATA.immediate,
      enabled: true,
      delayDays: 0,
      subject: "Azione richiesta: aggiornamento metodo di pagamento per {{nome_azienda}}",
      body:
        "Ciao {{nome_cliente}},\n\n" +
        "Abbiamo riscontrato un problema durante l'ultimo tentativo di addebito di {{importo}} per il tuo abbonamento a {{nome_azienda}}. Questo può accadere in caso di carta scaduta, blocchi temporanei o fondi insufficienti.\n\n" +
        "Per mantenere attivo il tuo accesso senza interruzioni, ti chiediamo di aggiornare o confermare i tuoi dati di pagamento tramite il link sicuro sottostante:\n\n" +
        "[ {{link_recupero}} ]\n\n" +
        "Se hai già provveduto, ti preghiamo di ignorare questa comunicazione.\n\n" +
        "Un cordiale saluto,\nIl team di {{nome_azienda}}",
    },
    {
      id: "first_reminder",
      ...STEP_METADATA.first_reminder,
      enabled: true,
      delayDays: 3,
      subject: "Il tuo abbonamento a {{nome_azienda}} richiede la tua attenzione",
      body:
        "Ciao {{nome_cliente}},\n\n" +
        "Ti ricordiamo che il pagamento di {{importo}} relativo al tuo account su {{nome_azienda}} risulta ancora in sospeso.\n\n" +
        "Per evitare la sospensione temporanea del servizio e mantenere attive tutte le tue funzionalità, completa il saldo in meno di 60 secondi:\n\n" +
        "[ {{link_recupero}} ]\n\n" +
        "In caso di difficoltà o domande relative alla fattura, rispondi direttamente a questa e-mail.\n\n" +
        "Cordiali saluti,\n{{nome_azienda}}",
    },
    {
      id: "final_notice",
      ...STEP_METADATA.final_notice,
      enabled: true,
      delayDays: 7,
      subject: "[URGENTE] Imminente sospensione dell'account {{nome_azienda}}",
      body:
        "Gentile {{nome_cliente}},\n\n" +
        "Questo è l'ultimo avviso prima della disattivazione del tuo accesso a {{nome_azienda}}. L'importo di {{importo}} non è stato ancora incassato.\n\n" +
        "Per evitare la chiusura definitiva del profilo e la perdita dei dati associati, ti invitiamo a regolarizzare la posizione immediatamente tramite questo link:\n\n" +
        "[ {{link_recupero}} ]\n\n" +
        "Trascorse 24 ore da questa notifica, il sistema sospenderà automaticamente l'erogazione del servizio.\n\n" +
        "Distinti saluti,\n{{nome_azienda}}",
    },
  ];
}

function defaultSettings(): DunningTemplatesSettings {
  return { automationEnabled: true, steps: defaultSteps() };
}

type DunningTemplateSettingsRow = {
  automation_enabled: boolean;
};

type DunningTemplateStepRow = {
  step_id: DunningTemplateStepId;
  enabled: boolean;
  delay_days: number;
  subject: string;
  body: string;
};

function mapStepRow(row: DunningTemplateStepRow): DunningTemplateStep {
  return {
    id: row.step_id,
    ...STEP_METADATA[row.step_id],
    enabled: row.enabled,
    delayDays: row.delay_days,
    subject: row.subject,
    body: row.body,
  };
}

/**
 * Legge automazione + step dunning per l'account collegato `userId`. Se le
 * righe non esistono ancora (migration non applicata, o utente senza
 * template salvati) o Supabase non è raggiungibile, ritorna i default
 * in-memory invece di far fallire webhook/cron/dashboard.
 */
export async function getDunningTemplates(userId: string): Promise<DunningTemplatesSettings> {
  try {
    const [settingsResult, stepsResult] = await Promise.all([
      supabaseAdmin
        .from("dunning_template_settings")
        .select("automation_enabled")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("dunning_template_steps")
        .select("step_id, enabled, delay_days, subject, body")
        .eq("user_id", userId),
    ]);

    if (settingsResult.error || stepsResult.error) {
      console.error(
        "[dunning-templates] errore nel recupero da Supabase:",
        (settingsResult.error ?? stepsResult.error)?.message
      );
      return defaultSettings();
    }

    const settingsRow = settingsResult.data as DunningTemplateSettingsRow | null;
    const stepRows = (stepsResult.data ?? []) as DunningTemplateStepRow[];

    if (!settingsRow || stepRows.length === 0) {
      return defaultSettings();
    }

    const stepById = new Map(stepRows.map((row) => [row.step_id, mapStepRow(row)]));
    const steps = STEP_ORDER.map((id) => stepById.get(id)).filter(
      (step): step is DunningTemplateStep => step !== undefined
    );

    return {
      automationEnabled: settingsRow.automation_enabled,
      steps: steps.length === STEP_ORDER.length ? steps : defaultSteps(),
    };
  } catch (error) {
    console.error("[dunning-templates] eccezione imprevista nel recupero da Supabase:", error);
    return defaultSettings();
  }
}

export async function updateDunningTemplates(
  next: DunningTemplatesSettings,
  userId: string
): Promise<DunningTemplatesSettings> {
  const { error: settingsError } = await supabaseAdmin.from("dunning_template_settings").upsert(
    {
      user_id: userId,
      automation_enabled: next.automationEnabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (settingsError) {
    throw new Error(`Errore nel salvataggio dell'automazione dunning su Supabase: ${settingsError.message}`);
  }

  const { error: stepsError } = await supabaseAdmin.from("dunning_template_steps").upsert(
    next.steps.map((step) => ({
      user_id: userId,
      step_id: step.id,
      enabled: step.enabled,
      delay_days: step.delayDays,
      subject: step.subject,
      body: step.body,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "user_id,step_id" }
  );

  if (stepsError) {
    throw new Error(`Errore nel salvataggio degli step dunning su Supabase: ${stepsError.message}`);
  }

  return getDunningTemplates(userId);
}
