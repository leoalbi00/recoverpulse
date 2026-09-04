import { NextResponse } from "next/server";
import { z } from "zod";

import { findUserByEmail } from "@/lib/users";
import { startTrialSignup } from "@/lib/trial-signup";
import { sendTrialActivationCodeEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const startSchema = z.object({
  firstName: z.string().trim().min(1, "Il nome è obbligatorio.").max(80),
  lastName: z.string().trim().min(1, "Il cognome è obbligatorio.").max(80),
  email: z.string().trim().toLowerCase().email("Email non valida."),
  phone: z.string().trim().min(1, "Il numero di telefono è obbligatorio.").max(40),
});

// Step 1 di /start-trial: avvia la registrazione self-serve e invia il
// codice di attivazione via email. Distinta da /api/register (invito-only,
// vedi il commento lì): questa route è pubblica ma limitata da rate limit
// su IP ed email, e rifiuta subito le email già registrate — evita di far
// completare a un utente esistente tutto il flusso OTP per poi fallire allo
// Step 3 su un vincolo di unicità.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed: ipAllowed, retryAfterSeconds } = checkRateLimit(`trial-signup-start:${ip}`, 5, 15 * 60);
  if (!ipAllowed) {
    return NextResponse.json(
      { error: "Troppi tentativi. Riprova più tardi." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi." }, { status: 400 });
  }

  const { email } = parsed.data;
  const { allowed: emailAllowed } = checkRateLimit(`trial-signup-start-email:${email}`, 5, 15 * 60);
  if (!emailAllowed) {
    return NextResponse.json({ error: "Troppi tentativi per questo indirizzo. Riprova più tardi." }, { status: 429 });
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "Un account con questa email esiste già. Accedi invece di registrarti." },
        { status: 409 }
      );
    }

    const code = await startTrialSignup(parsed.data);
    const emailSent = await sendTrialActivationCodeEmail({ to: email, firstName: parsed.data.firstName, code });

    // A differenza di magic-link/forgot-password (dove l'email non deve mai
    // rivelare se un account esiste), qui l'esito dell'invio viene mostrato
    // per davvero: senza email l'utente resterebbe bloccato su uno Step 2
    // che aspetta un codice mai arrivato, senza alcun modo di capire perché.
    // La riga trial_signups resta comunque salvata (upsert su email): un
    // retry dallo Step 1 rigenera un nuovo codice sulla stessa riga.
    if (!emailSent) {
      return NextResponse.json(
        { error: "Non siamo riusciti a inviare l'email con il codice di attivazione. Riprova tra qualche minuto." },
        { status: 502 }
      );
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error("[trial-signup/start] errore durante l'avvio della registrazione:", error);
    return NextResponse.json({ error: "Errore durante la registrazione. Riprova più tardi." }, { status: 500 });
  }
}
