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
  timing: z.object({
    step1: z.number().min(1),
    step2: z.number().min(1),
    step3: z.number().min(1),
  }),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  return NextResponse.json(getDunningSettings());
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

  const updated = updateDunningSettings(parsed.data);
  return NextResponse.json(updated);
}
