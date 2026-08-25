import "server-only";
import { Resend } from "resend";

import { getMerchantSettings, DEFAULT_MERCHANT_SETTINGS } from "@/lib/merchant-settings";
import { getIntegrationSettings } from "@/lib/integration-settings";
import { getReadableTextColor } from "@/lib/color";

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "RecoverPulse <onboarding@resend.dev>";

// Usa la Resend API Key salvata da /dashboard/impostazioni su Supabase se
// presente, altrimenti RESEND_API_KEY da env: una chiave salvata dalla
// dashboard ha così effetto immediato sull'invio, senza toccare .env.
async function getResendClient(): Promise<Resend | null> {
  const settings = await getIntegrationSettings();
  const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Marchio di fallback (nessun logo caricato dal merchant): stesso tracciato
// dell'icona "Activity" di lucide-react usata nell'app, in SVG inline così è
// visibile anche con il blocco immagini attivo di default nei client email.
function buildLogoMarkSvg(textColor: string): string {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${textColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
}

function buildShieldSvg(color: string): string {
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; margin-right:5px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`;
}

const LOCK_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; margin-right:5px;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

function buildDunningEmailHtml({
  customerName,
  planName,
  amountFormatted,
  recoveryLink,
  isFinalNotice = false,
  companyName,
  logoUrl,
  primaryColor,
  supportEmail,
}: {
  customerName: string;
  planName: string;
  amountFormatted: string;
  recoveryLink: string;
  isFinalNotice?: boolean;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  supportEmail: string;
}): string {
  const greeting = customerName && customerName !== "Gentile cliente" ? `Ciao ${customerName}` : "Gentile cliente";
  const preheader = isFinalNotice
    ? `Ultimo avviso: rischi l'interruzione del piano ${planName}. Aggiorna la carta in 1 click.`
    : `${greeting}, aggiorna il metodo di pagamento per ${planName} in meno di un minuto.`;

  const safeCompanyName = escapeHtml(companyName);
  const ctaTextColor = getReadableTextColor(primaryColor);
  const logoMark = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${safeCompanyName}" width="28" height="28" style="display:block; border-radius:8px; object-fit:contain;" />`
    : `<table role="presentation" cellpadding="0" cellspacing="0" width="28" height="28" style="background-color:${primaryColor}; border-radius:8px;">
                        <tr><td align="center" valign="middle">${buildLogoMarkSvg(ctaTextColor)}</td></tr>
                      </table>`;
  const supportLine = supportEmail
    ? `Domande? Scrivi a <a href="mailto:${escapeHtml(supportEmail)}" style="color:#71717a;">${escapeHtml(supportEmail)}</a>.`
    : "";

  return `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>Aggiorna il tuo metodo di pagamento</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:${FONT_STACK};">
    <!-- Preheader: testo di anteprima nella inbox, invisibile nel corpo dell'email -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${preheader}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; width:100%;">

            <!-- Logo -->
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:8px; vertical-align:middle;">
                      ${logoMark}
                    </td>
                    <td style="vertical-align:middle; font-size:16px; font-weight:700; color:#18181b; letter-spacing:-0.01em;">
                      ${safeCompanyName}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Card -->
            <tr>
              <td style="background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e4e4e7; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                  <!-- Accent top bar -->
                  <tr>
                    <td height="4" style="background-color:${primaryColor}; line-height:4px; font-size:4px;">&nbsp;</td>
                  </tr>

                  ${
                    isFinalNotice
                      ? `<tr>
                    <td style="padding:20px 32px 0 32px;">
                      <span style="display:inline-block; background-color:#fef2f2; color:#dc2626; font-size:11px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; padding:5px 10px; border-radius:999px;">
                        Ultimo avviso
                      </span>
                    </td>
                  </tr>`
                      : ""
                  }

                  <tr>
                    <td style="padding:${isFinalNotice ? "12" : "32"}px 32px 0 32px;">
                      <h1 style="margin:0 0 14px 0; font-size:21px; line-height:1.35; color:#18181b; font-weight:700;">
                        ${isFinalNotice ? "Il tuo abbonamento sta per essere sospeso" : "Il pagamento non è andato a buon fine"}
                      </h1>
                      <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#3f3f46;">
                        ${greeting}, non siamo riusciti ad addebitare <strong>${amountFormatted}</strong> per il piano
                        <strong>${planName}</strong>. Aggiorna il metodo di pagamento adesso: bastano meno di 60 secondi
                        e il servizio riparte subito, senza interruzioni.
                      </p>
                    </td>
                  </tr>

                  <!-- Importo dovuto -->
                  <tr>
                    <td style="padding:0 32px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:10px;">
                        <tr>
                          <td style="padding:14px 16px;">
                            <p style="margin:0; font-size:12px; color:#71717a; text-transform:uppercase; letter-spacing:0.04em;">${planName}</p>
                          </td>
                          <td align="right" style="padding:14px 16px;">
                            <p style="margin:0; font-size:16px; font-weight:700; color:#18181b;">${amountFormatted}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- CTA -->
                  <tr>
                    <td style="padding:24px 32px 8px 32px;" align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="border-radius:10px; background-color:${primaryColor};">
                            <a
                              href="${recoveryLink}"
                              style="display:block; width:100%; box-sizing:border-box; color:${ctaTextColor}; text-decoration:none; font-size:16px; font-weight:700; text-align:center; padding:15px 24px;"
                            >
                              Aggiorna metodo di pagamento →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Security badges -->
                  <tr>
                    <td style="padding:14px 32px 28px 32px;" align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size:12px; color:#71717a; padding-right:16px;">${buildShieldSvg(primaryColor)}Pagamento sicuro Stripe</td>
                          <td style="font-size:12px; color:#71717a;">${LOCK_SVG}Crittografia SSL 256-bit</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 32px 32px 32px;">
                      <p style="margin:0; font-size:12.5px; line-height:1.6; color:#a1a1aa;">
                        Se il pulsante non funziona, copia e incolla questo link nel browser:<br />
                        <a href="${recoveryLink}" style="color:#71717a; word-break:break-all;">${recoveryLink}</a>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 32px; border-top:1px solid #e4e4e7; background-color:#fafafa;">
                      <p style="margin:0; font-size:12px; line-height:1.6; color:#a1a1aa;">
                        Il link è valido 7 giorni ed è utilizzabile una sola volta. Se hai già aggiornato il pagamento, ignora questa email.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding:24px 16px 0 16px;">
                <p style="margin:0; font-size:12px; line-height:1.6; color:#a1a1aa;">
                  Inviato da ${safeCompanyName} per conto del fornitore del servizio ${planName}.${supportLine ? ` ${supportLine}` : ""}
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Invia l'email di dunning con il link monouso al portale di aggiornamento carta.
 * Se RESEND_API_KEY non è configurata, l'invio viene saltato (log soltanto) invece
 * di far fallire l'intero handling del webhook Stripe.
 */
export async function sendDunningEmail({
  to,
  customerName,
  planName,
  amountFormatted,
  recoveryLink,
  isFinalNotice = false,
}: {
  to: string;
  customerName: string;
  planName: string;
  amountFormatted: string;
  recoveryLink: string;
  /** Ultimo step della sequenza di solleciti (vedi src/app/api/cron/dunning/route.ts): tono più urgente. */
  isFinalNotice?: boolean;
}): Promise<void> {
  if (!to) {
    console.warn("[email] invio saltato: email cliente mancante.");
    return;
  }

  const resend = await getResendClient();
  if (!resend) {
    console.warn("[email] Resend API Key non configurata: invio email di dunning saltato.");
    return;
  }

  const merchant = await getMerchantSettings();
  const html = buildDunningEmailHtml({
    customerName,
    planName,
    amountFormatted,
    recoveryLink,
    isFinalNotice,
    companyName: merchant.companyName || DEFAULT_MERCHANT_SETTINGS.companyName,
    logoUrl: merchant.logoUrl,
    primaryColor: merchant.primaryColor || DEFAULT_MERCHANT_SETTINGS.primaryColor,
    supportEmail: merchant.supportEmail,
  });
  const subject = isFinalNotice
    ? `Ultimo avviso: il tuo abbonamento a ${planName} sta per essere sospeso`
    : `Azione richiesta: aggiorna il metodo di pagamento per ${planName}`;

  console.log(
    `[email] invio email di dunning tramite Resend: to="${to}" from="${FROM_ADDRESS}" subject="${subject}"`
  );

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(
        `[email] Resend ha risposto con un errore per l'invio a "${to}":`,
        JSON.stringify(error)
      );
      throw new Error(`Errore nell'invio dell'email di dunning tramite Resend: ${error.message}`);
    }

    console.log(
      `[email] email di dunning inviata con successo a "${to}" (Resend id: ${data?.id ?? "n/d"}).`
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Errore nell'invio dell'email di dunning tramite Resend")) {
      throw error;
    }
    console.error(`[email] eccezione imprevista durante la chiamata a Resend per "${to}":`, error);
    throw new Error(
      `Errore imprevisto nell'invio dell'email di dunning tramite Resend: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
