import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getDunningSettings, updateDunningSettings } from "@/lib/dunning-settings";

const settingsSchema = z.object({
  channels: z.object({
    whatsapp: z.boolean(),
    sms: z.boolean(),
    email: z.boolean(),
  }),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  return NextResponse.json(await getDunningSettings(session.user.id));
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi." }, { status: 400 });
  }

  // whatsapp/sms forzati a false lato server, non solo lato UI: nessuna
  // integrazione reale li invia (vedi src/lib/dunning.ts), quindi non vanno
  // attivabili nemmeno chiamando questa route direttamente.
  const updated = await updateDunningSettings(
    {
      ...parsed.data,
      channels: { ...parsed.data.channels, whatsapp: false, sms: false },
    },
    session.user.id,
  );
  return NextResponse.json(updated);
}
