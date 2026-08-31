import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getDunningTemplates, updateDunningTemplates } from "@/lib/dunning-templates";

const stepSchema = z.object({
  id: z.enum(["immediate", "first_reminder", "final_notice"]),
  label: z.string().min(1),
  description: z.string().min(1),
  enabled: z.boolean(),
  delayDays: z.number().min(0).max(90),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
});

const settingsSchema = z.object({
  automationEnabled: z.boolean(),
  steps: z.array(stepSchema).length(3),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  return NextResponse.json(await getDunningTemplates());
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

  const updated = await updateDunningTemplates(parsed.data);
  return NextResponse.json(updated);
}
