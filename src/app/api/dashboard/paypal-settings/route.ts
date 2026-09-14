import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getPaypalSettings, updatePaypalSettings, isPaypalConfigured } from "@/lib/paypal-settings";
import { testPaypalCredentials } from "@/lib/paypal";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  try {
    const settings = await getPaypalSettings(session.user.id);
    return NextResponse.json({
      clientId: settings.clientId,
      webhookId: settings.webhookId,
      connected: isPaypalConfigured(settings),
    });
  } catch (error) {
    console.error("[paypal-settings] errore nel recupero delle credenziali:", error);
    return NextResponse.json({ error: "Errore durante il recupero delle credenziali PayPal." }, { status: 500 });
  }
}

const saveSchema = z.object({
  clientId: z.string().trim().min(1, "Client ID obbligatorio."),
  clientSecret: z.string().trim().min(1, "Secret Key obbligatoria."),
});

/**
 * Salva Client ID/Secret solo dopo averli verificati con una vera chiamata
 * OAuth a PayPal (src/lib/paypal.ts, testPaypalCredentials): un pulsante
 * "Collega Account PayPal" che salva credenziali non valide senza
 * accorgersene lascerebbe il merchant convinto di essere collegato mentre il
 * webhook fallirebbe silenziosamente ad ogni evento.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi." }, { status: 400 });
  }

  try {
    await testPaypalCredentials(parsed.data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Credenziali PayPal non valide." },
      { status: 400 }
    );
  }

  try {
    const settings = await updatePaypalSettings(session.user.id, {
      clientId: parsed.data.clientId,
      clientSecret: parsed.data.clientSecret,
    });
    return NextResponse.json({ clientId: settings.clientId, connected: isPaypalConfigured(settings) });
  } catch (error) {
    console.error("[paypal-settings] errore nel salvataggio delle credenziali:", error);
    return NextResponse.json({ error: "Errore durante il salvataggio delle credenziali PayPal." }, { status: 500 });
  }
}

const webhookIdSchema = z.object({
  webhookId: z.string().trim().max(80),
});

/** Salva solo il Webhook ID (scheda "Configurazione Avanzata"), senza ritoccare Client ID/Secret. */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = webhookIdSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi." }, { status: 400 });
  }

  try {
    const settings = await updatePaypalSettings(session.user.id, { webhookId: parsed.data.webhookId });
    return NextResponse.json({ webhookId: settings.webhookId });
  } catch (error) {
    console.error("[paypal-settings] errore nel salvataggio del Webhook ID:", error);
    return NextResponse.json({ error: "Errore durante il salvataggio del Webhook ID." }, { status: 500 });
  }
}
