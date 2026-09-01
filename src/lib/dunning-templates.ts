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

const VARIABLE_PLACEHOLDER_BODY = (label: string) =>
  `Ciao {{nome_cliente}},\n\n${label} Il pagamento di {{importo}} per {{nome_piano}} non è ancora andato a buon fine.\n\nAggiorna il tuo metodo di pagamento qui:\n{{link_recupero}}\n\nGrazie,\nIl team`;

function defaultSteps(): DunningTemplateStep[] {
  return [
    {
      id: "immediate",
      ...STEP_METADATA.immediate,
      enabled: true,
      delayDays: 0,
      subject: "Azione richiesta: aggiorna il metodo di pagamento",
      body: VARIABLE_PLACEHOLDER_BODY(
        "Il pagamento del tuo abbonamento non è andato a buon fine: è necessaria un'azione da parte tua per evitare l'interruzione del servizio."
      ),
    },
    {
      id: "first_reminder",
      ...STEP_METADATA.first_reminder,
      enabled: true,
      delayDays: 3,
      subject: "Promemoria: {{nome_piano}} in attesa di pagamento",
      body: VARIABLE_PLACEHOLDER_BODY("Questo è un promemoria: il tuo abbonamento è ancora sospeso."),
    },
    {
      id: "final_notice",
      ...STEP_METADATA.final_notice,
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
