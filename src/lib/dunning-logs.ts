import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import type { PaymentMethodType } from "@/lib/transactions";

export type DunningLogChannel = "whatsapp" | "sms" | "email";
export type DunningLogStatus = "sent" | "failed";

// dunning_logs non ha (ancora) un tipo di evento dedicato per la conferma di
// recupero: piuttosto che una migration solo per questo, riusiamo lo schema
// esistente con uno step_days sentinella, impossibile da collidere con un
// vero step di sollecito (sempre >= 0, vedi step_days in dunning-settings.ts
// e il commento su "immediate" = 0 in startDunningSequence). Le funzioni di
// lettura sotto lo escludono esplicitamente per non gonfiare i "Tentativi
// Dunning" mostrati in dashboard con un evento che non è un sollecito.
export const RECOVERY_STEP_DAYS = -1;

// Sentinella distinta (non esclusa dalle letture sotto, a differenza di
// RECOVERY_STEP_DAYS): il tentativo "smart retry" fuori calendario pianificato
// da next_retry_at (src/lib/dunning-error-categorization.ts, consumato dal
// cron in src/app/api/cron/dunning/route.ts) è a tutti gli effetti
// un'email inviata al cliente, quindi resta visibile in "Tentativi
// Dunning"/"Ultima Azione" (getDunningLogSummaries) e nel log di sistema
// (listGlobalDunningLogs) — computeSequencePerformance (dashboard-analytics.ts)
// lo ignora comunque da sé, perché non coincide mai col delayDays di uno step
// reale del template (sempre >= 0). Il vincolo unique su (invoice_id,
// step_days) fa sì che una fattura possa registrare al più UN tentativo smart
// retry: se lo stesso invoice_id ricade una seconda volta in una categoria
// con next_retry_at (es. un nuovo insufficient_funds sullo stesso invoice_id
// riaperto da Stripe), il cron lo salta invece di inviarlo due volte — un
// limite noto, accettabile rispetto alla complessità di uno step_days
// variabile per data.
export const SMART_RETRY_STEP_DAYS = -2;

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
  /** 'card' (default) o 'sepa_debit', per distinguere in audit i solleciti originati da un insoluto SDD. */
  paymentMethodType?: PaymentMethodType;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("dunning_logs").insert({
    user_id: input.userId,
    invoice_id: input.invoiceId,
    step_days: input.stepDays,
    customer_email: input.customerEmail,
    channel: input.channel,
    status: input.status,
    payment_method_type: input.paymentMethodType ?? "card",
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
 * pagina /dashboard/recuperi per le colonne "Tentativi Dunning" e "Ultima
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
    .neq("step_days", RECOVERY_STEP_DAYS)
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
    .neq("step_days", RECOVERY_STEP_DAYS)
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

export type GlobalDunningLogEntry = {
  id: string;
  userId: string | null;
  invoiceId: string;
  stepDays: number;
  customerEmail: string;
  channel: DunningLogChannel;
  status: DunningLogStatus;
  sentAt: string;
};

/**
 * Log dei solleciti di TUTTI gli account, senza filtro per `user_id`: a
 * differenza di listAllDunningLogs (scoped per merchant, usata dalla
 * dashboard cliente) questa alimenta la sezione "Log di sistema" della vista
 * Sviluppatore (/dashboard/developer), riservata all'account admin.
 */
export async function listGlobalDunningLogs(limit: number): Promise<GlobalDunningLogEntry[]> {
  const { data, error } = await supabaseAdmin
    .from("dunning_logs")
    .select("id, user_id, invoice_id, step_days, customer_email, channel, status, sent_at")
    .neq("step_days", RECOVERY_STEP_DAYS)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Errore nel recupero del log di sistema su Supabase: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    invoiceId: row.invoice_id,
    stepDays: row.step_days,
    customerEmail: row.customer_email,
    channel: row.channel,
    status: row.status,
    sentAt: row.sent_at,
  }));
}
