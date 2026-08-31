import { NextResponse } from "next/server";
import { z } from "zod";

import { findUserByEmail } from "@/lib/users";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getAppBaseUrl } from "@/lib/app-url";

const schema = z.object({ email: z.string().email() });

// Risposta sempre identica, esista o no l'email: non deve rivelare quali
// indirizzi sono registrati (stesso principio del confronto a tempo
// costante usato per il codice invito in src/app/api/register/route.ts).
const GENERIC_RESPONSE = { message: "Se l'indirizzo esiste, riceverai un'email con le istruzioni per reimpostare la password." };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed: ipAllowed, retryAfterSeconds } = checkRateLimit(`forgot-password:${ip}`, 5, 15 * 60);
  if (!ipAllowed) {
    return NextResponse.json(
      { error: "Troppi tentativi. Riprova più tardi." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const email = parsed.data.email.toLowerCase();
  const { allowed: emailAllowed } = checkRateLimit(`forgot-password-email:${email}`, 5, 15 * 60);
  if (!emailAllowed) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  try {
    const user = await findUserByEmail(email);
    if (user) {
      const token = await createAuthToken(user.id, "password_reset");
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetLink: `${getAppBaseUrl()}/reset-password?token=${token}`,
      });
    }
  } catch (error) {
    console.error("[forgot-password] errore durante la generazione/invio del link di reset:", error);
    // Non propagato al client: la risposta resta generica anche in caso di
    // errore interno, per non rivelare nulla sull'esistenza dell'account.
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
