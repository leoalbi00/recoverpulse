import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { consumeAuthToken } from "@/lib/auth-tokens";
import { updatePasswordHash } from "@/lib/users";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri."),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`reset-password:${ip}`, 10, 15 * 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Troppi tentativi. Riprova più tardi." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi." }, { status: 400 });
  }

  try {
    // Hash calcolato prima di consumare il token: se bcrypt fallisse il link
    // resterebbe ancora valido. Il consumo è atomico (vedi consumeAuthToken):
    // lo stesso link non può essere usato due volte in parallelo.
    const newHash = await bcrypt.hash(parsed.data.password, 10);
    const authToken = await consumeAuthToken(parsed.data.token, "password_reset");
    if (!authToken) {
      return NextResponse.json({ error: "Link non valido o scaduto." }, { status: 400 });
    }

    await updatePasswordHash(authToken.userId, newHash);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reset-password] errore durante il reset della password:", error);
    return NextResponse.json({ error: "Errore durante il reset della password. Riprova." }, { status: 500 });
  }
}
