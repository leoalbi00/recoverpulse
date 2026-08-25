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
export async function hasDunningLogForStep(invoiceId: string, stepDays: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("dunning_logs")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("step_days", stepDays)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nel controllo dei solleciti già inviati su Supabase: ${error.message}`);
  }

  return data !== null;
}

export async function recordDunningLog(input: {
  invoiceId: string;
  stepDays: number;
  customerEmail: string;
  channel: DunningLogChannel;
  status: DunningLogStatus;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("dunning_logs").insert({
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
