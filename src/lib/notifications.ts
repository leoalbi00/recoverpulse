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
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  /** Dettagli grezzi legati all'evento (es. i campi del modulo pilota per un lead). */
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    metadata: input.metadata ?? null,
  });

  if (error) {
    throw new Error(`Errore nella creazione della notifica su Supabase: ${error.message}`);
  }
}

export async function listNotifications(limit: number, userId: string): Promise<Notification[]> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Errore nel recupero delle notifiche su Supabase: ${error.message}`);
  }

  return (data ?? []).map(mapRow);
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    throw new Error(`Errore nel conteggio delle notifiche non lette su Supabase: ${error.message}`);
  }

  return count ?? 0;
}

/** `userId` filtra anche `id`: senza, un utente potrebbe segnare come letta la notifica di un altro account indovinando l'UUID. */
export async function markNotificationAsRead(id: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Errore nell'aggiornamento della notifica su Supabase: ${error.message}`);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    throw new Error(`Errore nell'aggiornamento delle notifiche su Supabase: ${error.message}`);
  }
}

/** `userId` filtra anche `id`: stesso motivo di markNotificationAsRead. */
export async function deleteNotification(id: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("notifications").delete().eq("id", id).eq("user_id", userId);

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
      userId: transaction.userId,
      type: "recovery",
      title: "Pagamento recuperato",
      message: `Recuperati ${amountLabel} da ${transaction.customerName}`,
    });
  } catch (error) {
    console.error("[notifications] errore nella creazione della notifica di recupero:", error);
  }
}

/**
 * Notifica 'warning' creata dal webhook Stripe su invoice.payment_failed, non
 * appena la transazione fallita è registrata su Supabase. Come
 * notifyPaymentRecovered, non propaga errori: la registrazione del pagamento
 * fallito e l'avvio della sequenza di dunning non devono dipendere da questa.
 */
export async function notifyPaymentFailed(transaction: FailedTransaction): Promise<void> {
  const amountLabel = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: transaction.currency.toUpperCase(),
  }).format(transaction.amount / 100);

  try {
    await createNotification({
      userId: transaction.userId,
      type: "warning",
      title: "Pagamento fallito",
      message: `${transaction.customerName} non ha pagato ${amountLabel} per ${transaction.planName}`,
    });
  } catch (error) {
    console.error("[notifications] errore nella creazione della notifica di pagamento fallito:", error);
  }
}
