import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import {
  getIntegrationSettings,
  updateIntegrationSettings,
  maskSecret,
  type IntegrationSettings,
} from "@/lib/integration-settings";

const settingsSchema = z.object({
  stripeSecretKey: z.string().optional(),
  resendApiKey: z.string().optional(),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const settings = getIntegrationSettings();
  const fields = Object.keys(settings) as (keyof IntegrationSettings)[];

  return NextResponse.json(
    Object.fromEntries(
      fields.map((field) => [
        field,
        { configured: settings[field].length > 0, masked: maskSecret(settings[field]) },
      ])
    )
  );
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

  // I campi lasciati vuoti nel form significano "mantieni il valore attuale":
  // non vengono mai sovrascritti con una stringa vuota.
  const updates: Partial<IntegrationSettings> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (typeof value === "string" && value.trim().length > 0) {
      updates[key as keyof IntegrationSettings] = value.trim();
    }
  }

  updateIntegrationSettings(updates);
  return NextResponse.json({ success: true });
}
