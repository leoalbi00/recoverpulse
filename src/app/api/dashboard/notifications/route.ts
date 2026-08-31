import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  countUnreadNotifications,
  deleteNotification,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notifications";

const DEFAULT_LIST_LIMIT = 100;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit"));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : DEFAULT_LIST_LIMIT;

  try {
    const [notifications, unreadCount] = await Promise.all([
      listNotifications(limit, session.user.id),
      countUnreadNotifications(session.user.id),
    ]);
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("[notifications] errore nel recupero:", error);
    return NextResponse.json({ error: "Errore durante il recupero delle notifiche." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  try {
    if (body?.all === true) {
      await markAllNotificationsAsRead(session.user.id);
      return NextResponse.json({ success: true });
    }

    if (typeof body?.id === "string" && body.id.length > 0) {
      await markNotificationAsRead(body.id, session.user.id);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("[notifications] errore nell'aggiornamento:", error);
    return NextResponse.json({ error: "Errore durante l'aggiornamento su Supabase." }, { status: 500 });
  }

  return NextResponse.json({ error: "Dati non validi." }, { status: 400 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (typeof body?.id !== "string" || body.id.length === 0) {
    return NextResponse.json({ error: "Dati non validi." }, { status: 400 });
  }

  try {
    await deleteNotification(body.id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[notifications] errore nell'eliminazione:", error);
    return NextResponse.json({ error: "Errore durante l'eliminazione su Supabase." }, { status: 500 });
  }
}
