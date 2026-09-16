import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { clearGoCardlessAccountForUser, getConnectedGoCardlessAccountForUser } from "@/lib/connected-gocardless-accounts";

/** Stato della connessione GoCardless, letto da src/components/dashboard/gocardless-connect-card.tsx. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const account = await getConnectedGoCardlessAccountForUser(session.user.id).catch((error) => {
    console.error("[gocardless-connect] errore nel recupero dello stato:", error);
    return null;
  });

  return NextResponse.json({
    connected: account !== null,
    organisationId: account?.organisationId ?? null,
    organisationName: account?.organisationName ?? null,
  });
}

/** Disconnette GoCardless: elimina l'account collegato. */
export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  await clearGoCardlessAccountForUser(session.user.id);
  return NextResponse.json({ success: true });
}
