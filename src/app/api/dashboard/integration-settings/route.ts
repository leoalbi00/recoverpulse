import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import {
  getIntegrationSettings,
  updateIntegrationSettings,
  maskSecret,
  type IntegrationSettings,
} from "@/lib/integration-settings";

const settingsSchema = z.object({
  stripePublishableKey: z.string().optional(),
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
  // Chiavi GLOBALI di piattaforma (riga unica integration_settings, lette da
  // src/lib/email.ts per TUTTI gli invii, inclusi reset password e Magic
  // Link): solo l'account Sviluppatore può leggerle/modificarle, altrimenti
  // un qualunque merchant potrebbe sostituire la Resend API Key con la
  // propria e intercettare i link di accesso degli altri utenti.
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Accesso negato." }, { status: 403 });
  }

  const settings = await getIntegrationSettings();
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
  // Chiavi GLOBALI di piattaforma (riga unica integration_settings, lette da
  // src/lib/email.ts per TUTTI gli invii, inclusi reset password e Magic
  // Link): solo l'account Sviluppatore può leggerle/modificarle, altrimenti
  // un qualunque merchant potrebbe sostituire la Resend API Key con la
  // propria e intercettare i link di accesso degli altri utenti.
  if (!isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Accesso negato." }, { status: 403 });
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

  try {
    await updateIntegrationSettings(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[integration-settings] errore nel salvataggio:", error);
    return NextResponse.json({ error: "Errore durante il salvataggio su Supabase." }, { status: 500 });
  }
}
