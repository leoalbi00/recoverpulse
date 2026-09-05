import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getMerchantSettings, updateMerchantSettings } from "@/lib/merchant-settings";

// Tutti i campi opzionali: /dashboard/impostazioni divide il profilo
// merchant in due form indipendenti (dati legali in alto, brand in fondo),
// ognuno con il proprio pulsante Salva che invia solo i campi di propria
// competenza. updateMerchantSettings fa il merge con quanto già salvato.
const merchantSettingsSchema = z.object({
  firstName: z.string().trim().min(1, "Il nome è obbligatorio.").max(80).optional(),
  lastName: z.string().trim().min(1, "Il cognome è obbligatorio.").max(80).optional(),
  companyName: z.string().trim().min(1, "La ragione sociale è obbligatoria.").max(120).optional(),
  vatNumber: z.string().trim().min(1, "La Partita IVA / Codice Fiscale è obbligatoria.").max(40).optional(),
  legalAddress: z.string().trim().min(1, "L'indirizzo di sede legale è obbligatorio.").max(240).optional(),
  supportEmail: z.string().trim().email("Inserisci un'email di contatto valida.").optional(),
  phone: z.string().trim().min(1, "Il numero di telefono è obbligatorio.").max(40).optional(),
  logoUrl: z
    .string()
    .trim()
    .url("Inserisci un URL valido per il logo.")
    .max(2048)
    .optional()
    .or(z.literal("")),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Il colore deve essere un esadecimale valido, es. #10b981.")
    .optional(),
  senderName: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  return NextResponse.json(await getMerchantSettings(session.user.id));
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = merchantSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi." }, { status: 400 });
  }

  try {
    const updated = await updateMerchantSettings(
      {
        ...(parsed.data.firstName !== undefined && { firstName: parsed.data.firstName }),
        ...(parsed.data.lastName !== undefined && { lastName: parsed.data.lastName }),
        ...(parsed.data.companyName !== undefined && { companyName: parsed.data.companyName }),
        ...(parsed.data.vatNumber !== undefined && { vatNumber: parsed.data.vatNumber }),
        ...(parsed.data.legalAddress !== undefined && { legalAddress: parsed.data.legalAddress }),
        ...(parsed.data.supportEmail !== undefined && { supportEmail: parsed.data.supportEmail }),
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
        ...(parsed.data.logoUrl !== undefined && { logoUrl: parsed.data.logoUrl ? parsed.data.logoUrl : null }),
        ...(parsed.data.primaryColor !== undefined && { primaryColor: parsed.data.primaryColor }),
        ...(parsed.data.senderName !== undefined && { senderName: parsed.data.senderName ? parsed.data.senderName : null }),
      },
      session.user.id,
    );
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[merchant-settings] errore nel salvataggio:", error);
    return NextResponse.json({ error: "Errore durante il salvataggio su Supabase." }, { status: 500 });
  }
}
