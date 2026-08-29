import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";

import { createUser, DuplicateEmailError } from "@/lib/users";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri."),
  email: z.string().email("Email non valida."),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri."),
  inviteCode: z.string().min(1, "Codice invito mancante."),
});

// Confronto a tempo costante: evita che la durata della risposta riveli,
// tentativo dopo tentativo, quanti caratteri del codice sono già indovinati.
function isValidInviteCode(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  // La registrazione pubblica dà accesso a dati condivisi tra tutti gli
  // account (transazioni, chiavi di integrazione): finché il dashboard non è
  // multi-tenant, l'accesso resta invito-only. Nessun REGISTRATION_INVITE_CODE
  // configurato in produzione = registrazione disabilitata di default (fail closed).
  const expectedInviteCode = process.env.REGISTRATION_INVITE_CODE;
  if (!expectedInviteCode) {
    return NextResponse.json(
      { error: "Le registrazioni sono momentaneamente chiuse. Richiedi l'accesso al pilota dalla home page." },
      { status: 403 }
    );
  }

  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`register:${ip}`, 5, 15 * 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Troppi tentativi di registrazione. Riprova più tardi." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dati non validi." },
      { status: 400 }
    );
  }

  if (!isValidInviteCode(parsed.data.inviteCode, expectedInviteCode)) {
    return NextResponse.json({ error: "Codice invito non valido." }, { status: 403 });
  }

  try {
    const user = await createUser(parsed.data);
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Errore durante la registrazione:", error);
    return NextResponse.json(
      { error: "Errore durante la registrazione. Riprova più tardi." },
      { status: 500 }
    );
  }
}
