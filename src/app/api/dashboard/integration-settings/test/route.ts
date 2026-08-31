import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getIntegrationSettings } from "@/lib/integration-settings";

const testSchema = z.object({
  service: z.enum(["resend", "twilio"]),
  // Valore grezzo digitato nel form, non ancora salvato: testiamo quello così
  // l'utente può verificare una chiave prima ancora di premere "Salva".
  resendApiKey: z.string().optional(),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
});

type TestResult = { ok: boolean; message: string };

/**
 * Chiama un endpoint minimale e read-only del provider con le credenziali
 * fornite. Non usiamo gli SDK ufficiali qui: bastano fetch grezze, ed evitano
 * di legare l'esito del test allo scope specifico della chiave (una chiave
 * Stripe/Resend "ristretta" può rispondere 403 a un endpoint per cui non ha
 * permessi pur essendo perfettamente valida) — 401 è sempre e solo "chiave
 * non valida", qualunque altra risposta conferma che il servizio l'ha
 * autenticata.
 */
async function testAuthenticatedEndpoint(url: string, headers: Record<string, string>): Promise<TestResult> {
  try {
    const response = await fetch(url, { headers, cache: "no-store" });

    if (response.status === 401) {
      return { ok: false, message: "Chiave non valida o rifiutata dal servizio." };
    }
    if (response.ok || response.status === 403) {
      return { ok: true, message: "Connessione riuscita." };
    }
    return { ok: false, message: `Il servizio ha risposto con stato ${response.status}.` };
  } catch {
    return { ok: false, message: "Impossibile raggiungere il servizio. Riprova." };
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const { service } = parsed.data;

  // Se il campo è vuoto nel form, cade sulla chiave già salvata su Supabase:
  // così si può testare la connessione attiva senza dover ridigitare un
  // secret già configurato, e senza mai rispedirlo al browser per farlo.
  const saved = await getIntegrationSettings();

  if (service === "resend") {
    const key = (parsed.data.resendApiKey?.trim() || saved.resendApiKey).trim();
    if (!key) {
      return NextResponse.json({ ok: false, message: "Inserisci prima la Resend API Key." } satisfies TestResult);
    }
    return NextResponse.json(
      await testAuthenticatedEndpoint("https://api.resend.com/domains", { Authorization: `Bearer ${key}` })
    );
  }

  const sid = (parsed.data.twilioAccountSid?.trim() || saved.twilioAccountSid).trim();
  const token = (parsed.data.twilioAuthToken?.trim() || saved.twilioAuthToken).trim();
  if (!sid || !token) {
    return NextResponse.json({ ok: false, message: "Inserisci Account SID e Auth Token." } satisfies TestResult);
  }
  const basicAuth = Buffer.from(`${sid}:${token}`).toString("base64");
  return NextResponse.json(
    await testAuthenticatedEndpoint(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      Authorization: `Basic ${basicAuth}`,
    })
  );
}
