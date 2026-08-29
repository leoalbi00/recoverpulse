import { NextResponse } from "next/server";
import { z } from "zod";

import { createPilotRequest } from "@/lib/pilot-requests";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const pilotRequestSchema = z.object({
  name: z.string().trim().min(1, "Inserisci il tuo nome.").max(120),
  email: z.string().trim().email("Inserisci un'email valida."),
  company: z.string().trim().min(1, "Inserisci il nome della tua azienda.").max(160),
  estimatedMrr: z.string().trim().max(60).optional(),
  message: z.string().trim().max(2000).optional(),
  // Honeypot: campo invisibile per gli utenti reali, i bot di spam invece lo
  // compilano quasi sempre. Se arriva valorizzato rispondiamo comunque
  // "successo" (senza salvare nulla) per non rivelare al bot che è stato scoperto.
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`pilot-request:${ip}`, 5, 15 * 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Troppe richieste. Riprova più tardi." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = pilotRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi." },
      { status: 400 }
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ success: true });
  }

  try {
    await createPilotRequest({
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      estimatedMrr: parsed.data.estimatedMrr,
      message: parsed.data.message,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[pilot-request] errore nel salvataggio su Supabase:", error);
    return NextResponse.json(
      { error: "Errore durante l'invio. Riprova o scrivici direttamente." },
      { status: 500 }
    );
  }
}
