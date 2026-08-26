import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type NotificationType = "lead" | "recovery" | "warning";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function mapRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: row.is_read,
    createdAt: row.created_at,
  };
}

export async function createNotification(input: {
  type: NotificationType;
  title: string;
  message: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("notifications").insert({
    type: input.type,
    title: input.title,
    message: input.message,
  });

  if (error) {
    throw new Error(`Errore nella creazione della notifica su Supabase: ${error.message}`);
  }
}

export async function listNotifications(limit = 50): Promise<Notification[]> {
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
