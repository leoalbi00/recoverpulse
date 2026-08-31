import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendPilotRequestConfirmationEmail } from "@/lib/email";

export async function createPilotRequest(input: {
  name: string;
  email: string;
  company: string;
  estimatedMrr?: string;
  message?: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("pilot_requests").insert({
    name: input.name,
    email: input.email,
    company: input.company,
    estimated_mrr: input.estimatedMrr || null,
    message: input.message || null,
  });

  if (error) {
    throw new Error(`Errore nel salvataggio della richiesta pilota su Supabase: ${error.message}`);
  }

  // Nessuna notifica in-app per i lead pilota: le notifiche sono ora per
  // account collegato (vedi src/lib/notifications.ts), ma un lead pilota
  // riguarda RecoverPulse stesso, non un merchant specifico — instradarla a
  // un account a caso mostrerebbe dati di un lead di vendita nella dashboard
  // di un cliente. La richiesta resta comunque consultabile su Supabase
  // (tabella pilot_requests) e il lead riceve una conferma via email sotto.

  // Email di conferma al lead: effetto collaterale non critico, non deve far
  // fallire la richiesta pilota, già salvata con successo qui sopra.
  // sendPilotRequestConfirmationEmail non propaga mai errori di suo, ma
  // resta wrappata per coerenza con lo stesso principio.
  try {
    await sendPilotRequestConfirmationEmail({ to: input.email, name: input.name });
  } catch (emailError) {
    console.error("[pilot-requests] errore nell'invio dell'email di conferma:", emailError);
  }
}
