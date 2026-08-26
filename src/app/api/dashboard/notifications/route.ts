import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([listNotifications(), countUnreadNotifications()]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  try {
    if (body?.all === true) {
      await markAllNotificationsAsRead();
      return NextResponse.json({ success: true });
    }

    if (typeof body?.id === "string" && body.id.length > 0) {
      await markNotificationAsRead(body.id);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("[notifications] errore nell'aggiornamento:", error);
    return NextResponse.json({ error: "Errore durante l'aggiornamento su Supabase." }, { status: 500 });
  }

  return NextResponse.json({ error: "Dati non validi." }, { status: 400 });
}
