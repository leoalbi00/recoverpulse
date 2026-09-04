import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getMerchantSettings, DEFAULT_MERCHANT_SETTINGS } from "@/lib/merchant-settings";
import { buildDunningEmailHtml } from "@/lib/email";

const previewSchema = z.object({
  stepId: z.enum(["immediate", "first_reminder", "final_notice"]),
  // Oggetto/corpo arrivano già renderizzati (variabili {{...}} sostituite
  // client-side, vedi renderDunningTemplate in dunning-templates-manager.tsx):
  // qui serve solo il testo finale da incorniciare nell'HTML dell'email.
  subject: z.string().max(200),
  bodyText: z.string().max(5000),
  customerName: z.string().max(200),
  planName: z.string().max(200),
  amountFormatted: z.string().max(50),
  recoveryLink: z.string().max(500),
});

/**
 * Genera l'HTML reale (stesso builder usato dall'invio vero, src/lib/email.ts)
 * per l'anteprima grafica in /dashboard/dunning e /dashboard/impostazioni
 * (src/components/dashboard/dunning-templates-manager.tsx): a differenza del
 * vecchio modale solo-testo, mostra logo, colore e pulsante CTA reali del
 * merchant, con dati di esempio al posto di una fattura vera.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const parsed = previewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi." }, { status: 400 });
  }

  const merchant = await getMerchantSettings(session.user.id);
  const companyName = merchant.companyName || DEFAULT_MERCHANT_SETTINGS.companyName;

  const html = buildDunningEmailHtml({
    customerName: parsed.data.customerName,
    planName: parsed.data.planName,
    amountFormatted: parsed.data.amountFormatted,
    recoveryLink: parsed.data.recoveryLink,
    bodyText: parsed.data.bodyText,
    stepId: parsed.data.stepId,
    companyName,
    logoUrl: merchant.logoUrl,
    primaryColor: merchant.primaryColor || DEFAULT_MERCHANT_SETTINGS.primaryColor,
    supportEmail: merchant.supportEmail,
  });

  return NextResponse.json({ html, companyName });
}
