import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyTrialSignupOtp, type VerifyOtpFailureReason } from "@/lib/trial-signup";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().email("Email non valida."),
  code: z.string().trim().regex(/^\d{6}$/, "Il codice deve avere 6 cifre."),
});

const FAILURE_MESSAGES: Record<VerifyOtpFailureReason, string> = {
  not_found: "Richiesta di attivazione non trovata. Ricomincia la registrazione.",
  expired: "Il codice è scaduto. Ricomincia la registrazione per riceverne uno nuovo.",
  too_many_attempts: "Troppi tentativi con questo codice. Ricomincia la registrazione per riceverne uno nuovo.",
  invalid: "Codice non valido.",
};

// Step 2 di /start-trial: verifica il codice senza consumarlo (vedi
// src/lib/trial-signup.ts), solo per sbloccare lo Step 3 nella UI —
// /api/trial-signup/complete ri-verifica prima di creare l'account.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed: ipAllowed, retryAfterSeconds } = checkRateLimit(`trial-signup-verify:${ip}`, 10, 15 * 60);
  if (!ipAllowed) {
    return NextResponse.json(
      { error: "Troppi tentativi. Riprova più tardi." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi." }, { status: 400 });
  }

  const { email, code } = parsed.data;
  const { allowed: emailAllowed } = checkRateLimit(`trial-signup-verify-email:${email}`, 10, 15 * 60);
  if (!emailAllowed) {
    return NextResponse.json({ error: "Troppi tentativi per questo indirizzo. Riprova più tardi." }, { status: 429 });
  }

  try {
    const result = await verifyTrialSignupOtp(email, code);
    if (!result.ok) {
      return NextResponse.json({ error: FAILURE_MESSAGES[result.reason] }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[trial-signup/verify-otp] errore durante la verifica del codice:", error);
    return NextResponse.json({ error: "Errore durante la verifica. Riprova più tardi." }, { status: 500 });
  }
}
