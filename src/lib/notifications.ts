import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import type { FailedTransaction } from "@/lib/transactions";

export type NotificationType = "lead" | "recovery" | "warning";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function mapRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: row.is_read,
    createdAt: row.created_at,
    metadata: row.metadata ?? null,
  };
}

export async function createNotification(input: {
  type: NotificationType;
  title: string;
  message: string;
  /** Dettagli grezzi legati all'evento (es. i campi del modulo pilota per un lead). */
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("notifications").insert({
    type: input.type,
    title: input.title,
    message: input.message,
    metadata: input.metadata ?? null,
  });

  if (error) {
    throw new Error(`Errore nella creazione della notifica su Supabase: ${error.message}`);
  }
}

export async function listNotifications(limit = 100): Promise<Notification[]> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Errore nel recupero delle notifiche su Supabase: ${error.message}`);
  }

  return (data ?? []).map(mapRow);
}

export async function countUnreadNotifications(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) {
    throw new Error(`Errore nel conteggio delle notifiche non lette su Supabase: ${error.message}`);
  }

  return count ?? 0;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("notifications").update({ is_read: true }).eq("id", id);

  if (error) {
    throw new Error(`Errore nell'aggiornamento della notifica su Supabase: ${error.message}`);
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const { error } = await supabaseAdmin.from("notifications").update({ is_read: true }).eq("is_read", false);

  if (error) {
    throw new Error(`Errore nell'aggiornamento delle notifiche su Supabase: ${error.message}`);
  }
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("notifications").delete().eq("id", id);

  if (error) {
    throw new Error(`Errore nell'eliminazione della notifica su Supabase: ${error.message}`);
  }
}

/**
 * Notifica 'recovery' condivisa dai due percorsi che possono segnare una
 * fattura come recuperata: il webhook Stripe (invoice.payment_succeeded) e la
 * conferma simulata del portale /pay/[token] per le transazioni di test.
 * Non propaga errori: una notifica mancante non deve far fallire il flusso
 * di recupero, già andato a buon fine quando questa funzione viene chiamata.
 */
export async function notifyPaymentRecovered(transaction: FailedTransaction): Promise<void> {
  const amountLabel = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: transaction.currency.toUpperCase(),
  }).format(transaction.amount / 100);

  try {
    await createNotification({
      type: "recovery",
      title: "Pagamento recuperato",
      message: `Recuperati ${amountLabel} da ${transaction.customerName}`,
    });
  } catch (error) {
    console.error("[notifications] errore nella creazione della notifica di recupero:", error);
  }
}
