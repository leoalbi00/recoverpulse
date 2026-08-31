import { NextResponse } from "next/server";
import { z } from "zod";

import { findUserByEmail } from "@/lib/users";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendMagicLinkEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getAppBaseUrl } from "@/lib/app-url";

const schema = z.object({ email: z.string().email() });

// Stesso principio di /api/auth/forgot-password: risposta sempre identica,
// non deve rivelare quali email sono registrate.
const GENERIC_RESPONSE = { message: "Se l'indirizzo esiste, riceverai un'email con il link di accesso." };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed: ipAllowed, retryAfterSeconds } = checkRateLimit(`magic-link:${ip}`, 5, 15 * 60);
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
  const { allowed: emailAllowed } = checkRateLimit(`magic-link-email:${email}`, 5, 15 * 60);
  if (!emailAllowed) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  try {
    const user = await findUserByEmail(email);
    if (user) {
      const token = await createAuthToken(user.id, "magic_link");
      await sendMagicLinkEmail({
        to: user.email,
        name: user.name,
        signInLink: `${getAppBaseUrl()}/api/auth/magic-link/callback?token=${token}`,
      });
    }
  } catch (error) {
    console.error("[magic-link] errore durante la generazione/invio del link di accesso:", error);
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
