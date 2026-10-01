import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type WebhookProvider = "stripe" | "paypal" | "gocardless";

const UNIQUE_VIOLATION = "23505";

/**
 * Reclama un evento webhook prima di elaborarlo: `true` se è la prima volta
 * che questo (provider, event_id) viene visto, `false` se è una ridelivery
 * (retry del gateway, doppia consegna) già registrata — il chiamante deve
 * quindi saltare gli effetti collaterali (email, avvio/interruzione dunning)
 * e rispondere comunque 200 per non farlo ritentare all'infinito. L'unicità è
 * garantita dal vincolo su (provider, event_id) in `public.webhook_events`
 * (20260920120000_webhook_idempotency_and_smart_retry.sql): la insert stessa
 * è l'operazione atomica, non serve un controllo "select poi insert"
 * separato che sarebbe soggetto a race condition tra invocazioni concorrenti.
 */
export async function claimWebhookEvent(
  provider: WebhookProvider,
  eventId: string,
  eventType?: string | null
): Promise<boolean> {
  const { error } = await supabaseAdmin.from("webhook_events").insert({
    provider,
    event_id: eventId,
    event_type: eventType ?? null,
  });

  if (!error) return true;
  if (error.code === UNIQUE_VIOLATION) return false;

  // Errore diverso da un duplicato (es. Supabase irraggiungibile): meglio
  // elaborare l'evento comunque (rischio di un duplicato occasionale) che
  // perdere silenziosamente un insoluto reale per un problema infrastrutturale
  // temporaneo sulla tabella di idempotenza.
  console.error(`[webhook-idempotency] impossibile registrare l'evento ${provider}/${eventId}:`, error);
  return true;
}
