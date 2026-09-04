import { NextResponse } from "next/server";
import { z } from "zod";

import { createUser, findUserByEmail, DuplicateEmailError, setTrialEndsAt, type User } from "@/lib/users";
import { updateMerchantSettings, DEFAULT_MERCHANT_SETTINGS } from "@/lib/merchant-settings";
import { getPendingTrialSignup, verifyTrialSignupOtp, deleteTrialSignup } from "@/lib/trial-signup";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const TRIAL_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const completeSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email non valida."),
  code: z.string().trim().regex(/^\d{6}$/, "Il codice deve avere 6 cifre."),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri."),
});

// Step 3 di /start-trial: ri-verifica il codice OTP (lo Step 2 lo ha solo
// controllato senza consumarlo, vedi src/lib/trial-signup.ts) e, solo se
// ancora valido, crea l'account. Evita che un codice verificato allo Step 2
// ma poi scaduto — o riusato dopo il limite di tentativi — possa comunque
// portare alla creazione dell'utente.
//
// Sicura da ripetere con la stessa coppia email/codice se un guasto
// infrastrutturale (Supabase irraggiungibile, timeout) interrompe la
// richiesta a metà: ogni passo dopo createUser è idempotente
// (update/upsert/delete), e createUser stesso viene recuperato se
// l'account risulta già creato da un tentativo precedente andato a buon
// fine solo in parte — vedi il commento sul catch qui sotto.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed: ipAllowed, retryAfterSeconds } = checkRateLimit(`trial-signup-complete:${ip}`, 10, 15 * 60);
  if (!ipAllowed) {
    return NextResponse.json(
      { error: "Troppi tentativi. Riprova più tardi." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi." }, { status: 400 });
  }

  const { email, code, password } = parsed.data;

  try {
    const verification = await verifyTrialSignupOtp(email, code);
    if (!verification.ok) {
      return NextResponse.json({ error: "Codice non valido o scaduto. Ricomincia la registrazione." }, { status: 400 });
    }

    const pending = await getPendingTrialSignup(email);
    if (!pending) {
      return NextResponse.json({ error: "Richiesta di attivazione non trovata. Ricomincia la registrazione." }, { status: 400 });
    }

    let user: User;
    try {
      user = await createUser({
        name: `${pending.firstName} ${pending.lastName}`.trim(),
        email,
        password,
      });
    } catch (error) {
      if (!(error instanceof DuplicateEmailError)) throw error;

      // La riga trial_signups esiste ancora (controllato sopra) e l'OTP è
      // appena stato riverificato per questa email: l'unico modo per
      // arrivare qui con un utente già esistente è un tentativo precedente
      // di questo stesso Step 3 che ha creato l'account ma è poi fallito
      // su uno dei passi seguenti (Supabase irraggiungibile su
      // setTrialEndsAt/updateMerchantSettings, es. deploy in corso). Invece
      // di bloccare l'utente con un 409 su un account che ha già scelto
      // come password, recuperiamo quell'utente e completiamo i passi
      // mancanti sotto — sono tutti idempotenti (update/upsert/delete).
      const existingUser = await findUserByEmail(email);
      if (!existingUser) throw error;
      user = existingUser;
    }

    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * DAY_MS).toISOString();
    await setTrialEndsAt(user.id, trialEndsAt);

    // supportEmail resta vuota (non companyName, dato reale non ancora
    // fornito in questo flusso): il banner "Completa i dati aziendali
    // obbligatori" di /dashboard/impostazioni deve continuare a comparire
    // finché il merchant non inserisce davvero nome azienda ed email di
    // supporto, vedi isMerchantProfileComplete in src/lib/merchant-settings.ts.
    await updateMerchantSettings(
      { ...DEFAULT_MERCHANT_SETTINGS, phone: pending.phone },
      user.id
    );

    await deleteTrialSignup(email);

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("[trial-signup/complete] errore durante il completamento della registrazione:", error);
    return NextResponse.json({ error: "Errore durante la registrazione. Riprova più tardi." }, { status: 500 });
  }
}
