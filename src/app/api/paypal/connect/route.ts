import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { clearPaypalSettings, getPaypalSettings, isPaypalConfigured } from "@/lib/paypal-settings";

/** Stato della connessione PayPal, letto da src/components/dashboard/paypal-settings-panel.tsx. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const settings = await getPaypalSettings(session.user.id).catch((error) => {
    console.error("[paypal-connect] errore nel recupero dello stato:", error);
    return null;
  });

  return NextResponse.json({
    connected: settings ? isPaypalConfigured(settings) : false,
    merchantId: settings?.merchantId ?? null,
    email: settings?.email ?? null,
  });
}

/** Disconnette PayPal: elimina la connessione salvata. */
export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  await clearPaypalSettings(session.user.id);
  return NextResponse.json({ success: true });
}
