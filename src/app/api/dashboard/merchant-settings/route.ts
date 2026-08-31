import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getMerchantSettings, updateMerchantSettings } from "@/lib/merchant-settings";

const merchantSettingsSchema = z.object({
  companyName: z.string().trim().min(1, "Il nome azienda è obbligatorio.").max(120),
  supportEmail: z.string().trim().email("Inserisci un'email di supporto valida."),
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
    .regex(/^#[0-9a-fA-F]{6}$/, "Il colore deve essere un esadecimale valido, es. #10b981."),
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
        companyName: parsed.data.companyName,
        supportEmail: parsed.data.supportEmail,
        logoUrl: parsed.data.logoUrl ? parsed.data.logoUrl : null,
        primaryColor: parsed.data.primaryColor,
      },
      session.user.id,
    );
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[merchant-settings] errore nel salvataggio:", error);
    return NextResponse.json({ error: "Errore durante il salvataggio su Supabase." }, { status: 500 });
  }
}
