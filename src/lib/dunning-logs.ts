import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type DunningLogChannel = "whatsapp" | "sms" | "email";
export type DunningLogStatus = "sent" | "failed";

// Codice errore Postgres per violazione di un vincolo unique: due esecuzioni
// concorrenti del cron dei solleciti hanno provato a registrare lo stesso
// step per la stessa fattura, la seconda arriva qui e va ignorata (non è un
// errore reale, è la garanzia di idempotenza a fare il suo lavoro).
const UNIQUE_VIOLATION = "23505";

/**
 * Verifica se il sollecito per uno specifico step (giorni trascorsi) è già
 * stato registrato per questa fattura, per evitare di inviarlo due volte.
 */
export async function hasDunningLogForStep(invoiceId: string, stepDays: number, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("dunning_logs")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("step_days", stepDays)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nel controllo dei solleciti già inviati su Supabase: ${error.message}`);
  }

  return data !== null;
}

export async function recordDunningLog(input: {
  userId: string;
  invoiceId: string;
  stepDays: number;
  customerEmail: string;
  channel: DunningLogChannel;
  status: DunningLogStatus;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("dunning_logs").insert({
    user_id: input.userId,
    invoice_id: input.invoiceId,
    step_days: input.stepDays,
    customer_email: input.customerEmail,
    channel: input.channel,
    status: input.status,
  });

  if (error && error.code !== UNIQUE_VIOLATION) {
    throw new Error(`Errore nella registrazione del sollecito su Supabase: ${error.message}`);
  }
}

export type DunningLogSummary = {
  /** Numero di solleciti registrati (step del cron di dunning) per la fattura. */
  attempts: number;
  lastChannel: DunningLogChannel;
  lastStatus: DunningLogStatus;
  lastSentAt: string;
};

/**
 * Riepiloga i solleciti già inviati per un gruppo di fatture (usata dalla
 * pagina /dashboard/transazioni per le colonne "Tentativi Dunning" e "Ultima
 * Azione"). Una sola query per tutte le fatture visualizzate, invece di una
 * query per riga.
 */
export async function getDunningLogSummaries(
  invoiceIds: string[],
  userId: string
): Promise<Map<string, DunningLogSummary>> {
  const summaries = new Map<string, DunningLogSummary>();
  if (invoiceIds.length === 0) return summaries;

  const { data, error } = await supabaseAdmin
    .from("dunning_logs")
    .select("invoice_id, channel, status, sent_at")
    .in("invoice_id", invoiceIds)
    .eq("user_id", userId)
    .order("sent_at", { ascending: true });

  if (error) {
    throw new Error(`Errore nel recupero dello storico solleciti su Supabase: ${error.message}`);
  }

  for (const row of data ?? []) {
    const invoiceId: string | null = row.invoice_id;
    if (!invoiceId) continue;

    summaries.set(invoiceId, {
      attempts: (summaries.get(invoiceId)?.attempts ?? 0) + 1,
      lastChannel: row.channel,
      lastStatus: row.status,
      lastSentAt: row.sent_at,
    });
  }

  return summaries;
}

/**
 * Tutti i solleciti registrati (invoice_id, step_days, status) per un
 * account, usata dalla dashboard principale (src/app/dashboard/page.tsx) per
 * calcolare il tasso di conversione per step della sequenza dunning
 * (src/lib/dashboard-analytics.ts, computeSequencePerformance). A differenza
 * di getDunningLogSummaries non aggrega per fattura: serve il dettaglio per
 * step per capire quali step ha effettivamente raggiunto ciascuna fattura.
 */
export async function listAllDunningLogs(
  userId: string
): Promise<{ invoiceId: string; stepDays: number; status: DunningLogStatus }[]> {
  const { data, error } = await supabaseAdmin
    .from("dunning_logs")
    .select("invoice_id, step_days, status")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false })
    .limit(2000);

  if (error) {
    throw new Error(`Errore nel recupero dei solleciti su Supabase: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    invoiceId: row.invoice_id,
    stepDays: row.step_days,
    status: row.status,
  }));
}
