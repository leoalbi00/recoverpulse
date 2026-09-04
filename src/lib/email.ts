import "server-only";
import { Resend } from "resend";

import { getMerchantSettings, DEFAULT_MERCHANT_SETTINGS } from "@/lib/merchant-settings";
import { getIntegrationSettings } from "@/lib/integration-settings";
import { getReadableTextColor } from "@/lib/color";
import {
  getDunningTemplates,
  renderDunningTemplate,
  type DunningTemplateStepId,
} from "@/lib/dunning-templates";

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
  bodyText,
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
  /** Corpo email già renderizzato (variabili sostituite) dal template configurato in /dashboard/dunning. */
  bodyText: string;
  isFinalNotice?: boolean;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  supportEmail: string;
}): string {
  // customerName e planName arrivano da Stripe (nome del Customer / descrizione
  // riga fattura): un cliente può impostarli liberamente sul proprio account,
  // quindi vanno trattati come input non fidato ed escapati prima di finire
  // nell'HTML dell'email, esattamente come companyName/supportEmail qui sotto.
  // bodyText arriva invece dal merchant (template salvato in dashboard), ma è
  // comunque testo libero: stessa cautela.
  const safeCustomerName = escapeHtml(customerName);
  const safePlanName = escapeHtml(planName);
  const safeAmountFormatted = escapeHtml(amountFormatted);
  const safeRecoveryLink = escapeHtml(recoveryLink);
  const safeBodyHtml = escapeHtml(bodyText).replace(/\n/g, "<br />");

  const greeting =
    customerName && customerName !== "Gentile cliente" ? `Ciao ${safeCustomerName}` : "Gentile cliente";
  const preheader = isFinalNotice
    ? `Ultimo avviso: rischi l'interruzione del piano ${safePlanName}. Aggiorna la carta in 1 click.`
    : `${greeting}, aggiorna il metodo di pagamento per ${safePlanName} in meno di un minuto.`;

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
                      <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#3f3f46; white-space:normal;">
                        ${safeBodyHtml}
                      </p>
                    </td>
                  </tr>

                  <!-- Importo dovuto -->
                  <tr>
                    <td style="padding:0 32px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:10px;">
                        <tr>
                          <td style="padding:14px 16px;">
                            <p style="margin:0; font-size:12px; color:#71717a; text-transform:uppercase; letter-spacing:0.04em;">${safePlanName}</p>
                          </td>
                          <td align="right" style="padding:14px 16px;">
                            <p style="margin:0; font-size:16px; font-weight:700; color:#18181b;">${safeAmountFormatted}</p>
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
                              href="${safeRecoveryLink}"
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
                        <a href="${safeRecoveryLink}" style="color:#71717a; word-break:break-all;">${safeRecoveryLink}</a>
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
                  Inviato da ${safeCompanyName} per conto del fornitore del servizio ${safePlanName}.${supportLine ? ` ${supportLine}` : ""}
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

function buildRecoveryEmailHtml({
  customerName,
  planName,
  amountFormatted,
  companyName,
  logoUrl,
  primaryColor,
  supportEmail,
}: {
  customerName: string;
  planName: string;
  amountFormatted: string;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  supportEmail: string;
}): string {
  // Stessa cautela di buildDunningEmailHtml: customerName/planName arrivano
  // da Stripe (input non fidato), companyName/supportEmail dal merchant.
  const safeCustomerName = escapeHtml(customerName);
  const safePlanName = escapeHtml(planName);
  const safeAmountFormatted = escapeHtml(amountFormatted);
  const safeCompanyName = escapeHtml(companyName);

  const greeting =
    customerName && customerName !== "Gentile cliente" ? `Ciao ${safeCustomerName}` : "Gentile cliente";
  const preheader = `${greeting}, il pagamento di ${safeAmountFormatted} per ${safePlanName} è andato a buon fine.`;

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
    <title>Pagamento confermato</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:${FONT_STACK};">
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

                  <tr>
                    <td height="4" style="background-color:#10b981; line-height:4px; font-size:4px;">&nbsp;</td>
                  </tr>

                  <tr>
                    <td style="padding:32px 32px 0 32px;" align="center">
                      <span style="display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:9999px; background-color:#d1fae5;">
                        <span style="color:#059669; font-size:24px; line-height:1;">✓</span>
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:16px 32px 0 32px;" align="center">
                      <h1 style="margin:0 0 14px 0; font-size:21px; line-height:1.35; color:#18181b; font-weight:700;">
                        Pagamento completato con successo
                      </h1>
                      <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#3f3f46; text-align:center;">
                        ${greeting}, il pagamento è andato a buon fine e il tuo abbonamento
                        <strong>${safePlanName}</strong> è di nuovo attivo. Nessuna ulteriore azione richiesta.
                      </p>
                    </td>
                  </tr>

                  <!-- Importo pagato -->
                  <tr>
                    <td style="padding:0 32px 32px 32px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:10px;">
                        <tr>
                          <td style="padding:14px 16px;">
                            <p style="margin:0; font-size:12px; color:#71717a; text-transform:uppercase; letter-spacing:0.04em;">${safePlanName}</p>
                          </td>
                          <td align="right" style="padding:14px 16px;">
                            <p style="margin:0; font-size:16px; font-weight:700; color:#18181b;">${safeAmountFormatted}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 32px; border-top:1px solid #e4e4e7; background-color:#fafafa;">
                      <p style="margin:0; font-size:12px; line-height:1.6; color:#a1a1aa;">
                        Questa è una conferma automatica, non è richiesta alcuna risposta.
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
                  Inviato da ${safeCompanyName} per conto del fornitore del servizio ${safePlanName}.${supportLine ? ` ${supportLine}` : ""}
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

const RECOVERPULSE_BRAND_COLOR = "#10b981";

/**
 * Email di conferma inviata a chi compila il form "Integrazione Pilota" in
 * Home. A differenza delle altre email qui sotto non riguarda un merchant
 * cliente (nessun logo/colore/nome azienda personalizzato): è RecoverPulse
 * stesso a scrivere al lead, quindi il brand è fisso invece di venire da
 * getMerchantSettings() (quello è il brand del *cliente* RecoverPulse, usato
 * nelle sue email di dunning verso i propri utenti finali).
 */
function buildPilotRequestConfirmationEmailHtml({ name }: { name: string }): string {
  const safeName = escapeHtml(name);
  const firstName = safeName.split(" ")[0] || safeName;
  const preheader = "Grazie per la richiesta: ti contattiamo entro 1 giorno lavorativo.";

  return `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>Richiesta pilota ricevuta</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:${FONT_STACK};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${preheader}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; width:100%;">

            <tr>
              <td align="center" style="padding-bottom:24px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:8px; vertical-align:middle;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="28" height="28" style="background-color:${RECOVERPULSE_BRAND_COLOR}; border-radius:8px;">
                        <tr><td align="center" valign="middle">${buildLogoMarkSvg("#052e21")}</td></tr>
                      </table>
                    </td>
                    <td style="vertical-align:middle; font-size:16px; font-weight:700; color:#18181b; letter-spacing:-0.01em;">
                      RecoverPulse
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e4e4e7; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                  <tr>
                    <td height="4" style="background-color:${RECOVERPULSE_BRAND_COLOR}; line-height:4px; font-size:4px;">&nbsp;</td>
                  </tr>

                  <tr>
                    <td style="padding:32px 32px 0 32px;">
                      <h1 style="margin:0 0 14px 0; font-size:21px; line-height:1.35; color:#18181b; font-weight:700;">
                        Richiesta ricevuta, ${firstName}!
                      </h1>
                      <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#3f3f46;">
                        Grazie per aver richiesto l&#39;integrazione pilota di RecoverPulse. Il nostro
                        team esaminerà i dettagli e ti contatterà entro <strong>1 giorno lavorativo</strong>
                        per organizzare il collegamento del tuo account Stripe di test.
                      </p>
                      <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#3f3f46;">
                        Nel frattempo, se vuoi farti un&#39;idea di quanto fatturato potresti recuperare,
                        puoi usare il calcolatore ROI sul nostro sito.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 32px 32px 32px;">
                      <p style="margin:0; font-size:12.5px; line-height:1.6; color:#a1a1aa;">
                        Questa è una conferma automatica: non è richiesta alcuna risposta a questa email.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:24px 16px 0 16px;">
                <p style="margin:0; font-size:12px; line-height:1.6; color:#a1a1aa;">
                  Inviato da RecoverPulse in seguito alla tua richiesta su recoverpulse.app.
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
 * Invia l'email di conferma al lead subito dopo l'invio del form "Integrazione
 * Pilota" (src/components/landing/pilot-request-form.tsx). Non propaga mai
 * errori — chiamata come effetto collaterale non critico dopo che la
 * richiesta è già stata salvata su Supabase (src/lib/pilot-requests.ts),
 * stesso principio di sendRecoveryConfirmationEmail.
 */
export async function sendPilotRequestConfirmationEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}): Promise<void> {
  if (!to) return;

  try {
    const resend = await getResendClient();
    if (!resend) {
      console.warn("[email] Resend API Key non configurata: invio conferma richiesta pilota saltato.");
      return;
    }

    const html = buildPilotRequestConfirmationEmailHtml({ name });
    const subject = "Richiesta pilota ricevuta — ti contattiamo a breve";

    console.log(
      `[email] invio email di conferma richiesta pilota tramite Resend: to="${to}" from="${FROM_ADDRESS}" subject="${subject}"`
    );

    const { data, error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });

    if (error) {
      console.error(
        `[email] Resend ha risposto con un errore per la conferma richiesta pilota a "${to}":`,
        JSON.stringify(error)
      );
      return;
    }

    console.log(
      `[email] email di conferma richiesta pilota inviata con successo a "${to}" (Resend id: ${data?.id ?? "n/d"}).`
    );
  } catch (error) {
    console.error(`[email] eccezione imprevista nell'invio della conferma richiesta pilota a "${to}":`, error);
  }
}

/**
 * Invia l'email di conferma al cliente quando un pagamento fallito viene
 * recuperato dal portale /pay/[token] (sia con Stripe reale sia in modalità
 * simulazione). Non propaga mai errori — chiamata come effetto collaterale
 * non critico dopo che la fattura è già stata marcata "recuperato" su
 * Supabase (src/app/api/update-payment/[token]/confirm/route.ts), stesso
 * principio di notifyPaymentRecovered/notifyPaymentFailed.
 */
export async function sendRecoveryConfirmationEmail({
  userId,
  to,
  customerName,
  planName,
  amountFormatted,
}: {
  userId: string;
  to: string;
  customerName: string;
  planName: string;
  amountFormatted: string;
}): Promise<void> {
  if (!to) {
    console.warn("[email] invio email di conferma recupero saltato: email cliente mancante.");
    return;
  }

  try {
    const resend = await getResendClient();
    if (!resend) {
      console.warn("[email] Resend API Key non configurata: invio email di conferma recupero saltato.");
      return;
    }

    const merchant = await getMerchantSettings(userId);
    const companyName = merchant.companyName || DEFAULT_MERCHANT_SETTINGS.companyName;
    const html = buildRecoveryEmailHtml({
      customerName,
      planName,
      amountFormatted,
      companyName,
      logoUrl: merchant.logoUrl,
      primaryColor: merchant.primaryColor || DEFAULT_MERCHANT_SETTINGS.primaryColor,
      supportEmail: merchant.supportEmail,
    });
    const subject = `Pagamento confermato: ${planName} è di nuovo attivo`;

    console.log(
      `[email] invio email di conferma recupero tramite Resend: to="${to}" from="${FROM_ADDRESS}" subject="${subject}"`
    );

    const { data, error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });

    if (error) {
      console.error(
        `[email] Resend ha risposto con un errore per la conferma di recupero a "${to}":`,
        JSON.stringify(error)
      );
      return;
    }

    console.log(
      `[email] email di conferma recupero inviata con successo a "${to}" (Resend id: ${data?.id ?? "n/d"}).`
    );
  } catch (error) {
    console.error(`[email] eccezione imprevista nell'invio della conferma di recupero a "${to}":`, error);
  }
}

/**
 * Invia l'email di dunning con il link monouso al portale di aggiornamento carta.
 * Oggetto e corpo vengono renderizzati dal template dello step configurato in
 * /dashboard/dunning (src/lib/dunning-templates.ts) — se il merchant lo
 * modifica da dashboard, l'email cambia di conseguenza.
 * Se RESEND_API_KEY non è configurata, l'invio viene saltato (log soltanto) invece
 * di far fallire l'intero handling del webhook Stripe.
 */
export async function sendDunningEmail({
  userId,
  to,
  customerName,
  planName,
  amountFormatted,
  recoveryLink,
  stepId,
}: {
  userId: string;
  to: string;
  customerName: string;
  planName: string;
  amountFormatted: string;
  recoveryLink: string;
  /** Step della sequenza dunning (immediate/first_reminder/final_notice) il cui template va usato. */
  stepId: DunningTemplateStepId;
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

  const merchant = await getMerchantSettings(userId);
  const companyName = merchant.companyName || DEFAULT_MERCHANT_SETTINGS.companyName;
  const isFinalNotice = stepId === "final_notice";

  const templates = await getDunningTemplates(userId);
  const step = templates.steps.find((candidate) => candidate.id === stepId);
  if (!step) {
    console.error(`[email] template dunning mancante per lo step "${stepId}": invio email saltato.`);
    return;
  }

  const vars = {
    nome_cliente: customerName,
    importo: amountFormatted,
    nome_piano: planName,
    nome_azienda: companyName,
    link_recupero: recoveryLink,
  };
  const subject = renderDunningTemplate(step.subject, vars);
  const bodyText = renderDunningTemplate(step.body, vars);

  const html = buildDunningEmailHtml({
    customerName,
    planName,
    amountFormatted,
    recoveryLink,
    bodyText,
    isFinalNotice,
    companyName,
    logoUrl: merchant.logoUrl,
    primaryColor: merchant.primaryColor || DEFAULT_MERCHANT_SETTINGS.primaryColor,
    supportEmail: merchant.supportEmail,
  });

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

function buildCardExpiringEmailHtml({
  customerName,
  last4,
  expMonth,
  expYear,
  updateLink,
  companyName,
  logoUrl,
  primaryColor,
  supportEmail,
}: {
  customerName: string;
  last4: string;
  expMonth: number;
  expYear: number;
  updateLink: string;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  supportEmail: string;
}): string {
  const safeCustomerName = escapeHtml(customerName);
  const safeCompanyName = escapeHtml(companyName);
  const safeUpdateLink = escapeHtml(updateLink);
  const safeLast4 = escapeHtml(last4);
  const expLabel = `${String(expMonth).padStart(2, "0")}/${expYear}`;

  const greeting =
    customerName && customerName !== "Gentile cliente" ? `Ciao ${safeCustomerName}` : "Gentile cliente";
  const preheader = `${greeting}, la tua carta che termina con ${safeLast4} scade a ${expLabel}: aggiornala in 1 click.`;

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
    <title>La tua carta sta per scadere</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:${FONT_STACK};">
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

                  <tr>
                    <td height="4" style="background-color:${primaryColor}; line-height:4px; font-size:4px;">&nbsp;</td>
                  </tr>

                  <tr>
                    <td style="padding:20px 32px 0 32px;">
                      <span style="display:inline-block; background-color:#fffbeb; color:#b45309; font-size:11px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; padding:5px 10px; border-radius:999px;">
                        Carta in scadenza
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:12px 32px 0 32px;">
                      <h1 style="margin:0 0 14px 0; font-size:21px; line-height:1.35; color:#18181b; font-weight:700;">
                        La tua carta sta per scadere
                      </h1>
                      <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#3f3f46;">
                        ${greeting}, la carta che termina con <strong>${safeLast4}</strong> in uso per il tuo
                        abbonamento scade a <strong>${expLabel}</strong>. Aggiornala ora per evitare
                        un&#39;interruzione del servizio al prossimo rinnovo.
                      </p>
                    </td>
                  </tr>

                  <!-- CTA -->
                  <tr>
                    <td style="padding:0 32px 8px 32px;" align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="border-radius:10px; background-color:${primaryColor};">
                            <a
                              href="${safeUpdateLink}"
                              style="display:block; width:100%; box-sizing:border-box; color:${ctaTextColor}; text-decoration:none; font-size:16px; font-weight:700; text-align:center; padding:15px 24px;"
                            >
                              Aggiorna la tua carta →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

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
                        <a href="${safeUpdateLink}" style="color:#71717a; word-break:break-all;">${safeUpdateLink}</a>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 32px; border-top:1px solid #e4e4e7; background-color:#fafafa;">
                      <p style="margin:0; font-size:12px; line-height:1.6; color:#a1a1aa;">
                        Il link è valido 7 giorni. Se hai già aggiornato la carta, ignora questa email.
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
                  Inviato da ${safeCompanyName}.${supportLine ? ` ${supportLine}` : ""}
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
 * Invia l'email preventiva quando Stripe segnala che una carta salvata sta
 * per scadere (customer.source.expiring, solo integrazioni Card/Source
 * legacy). Non propaga mai errori — stesso principio delle altre email di
 * questo file: un invio mancato non deve far fallire la gestione del
 * webhook, il prossimo tentativo di addebito resta comunque protetto dalla
 * normale sequenza di dunning se la carta arriva davvero a fallire.
 */
export async function sendCardExpiringEmail({
  userId,
  to,
  customerName,
  last4,
  expMonth,
  expYear,
  updateLink,
}: {
  userId: string;
  to: string;
  customerName: string;
  last4: string;
  expMonth: number;
  expYear: number;
  updateLink: string;
}): Promise<void> {
  if (!to) {
    console.warn("[email] invio email carta in scadenza saltato: email cliente mancante.");
    return;
  }

  try {
    const resend = await getResendClient();
    if (!resend) {
      console.warn("[email] Resend API Key non configurata: invio email carta in scadenza saltato.");
      return;
    }

    const merchant = await getMerchantSettings(userId);
    const companyName = merchant.companyName || DEFAULT_MERCHANT_SETTINGS.companyName;
    const html = buildCardExpiringEmailHtml({
      customerName,
      last4,
      expMonth,
      expYear,
      updateLink,
      companyName,
      logoUrl: merchant.logoUrl,
      primaryColor: merchant.primaryColor || DEFAULT_MERCHANT_SETTINGS.primaryColor,
      supportEmail: merchant.supportEmail,
    });
    const subject = `La tua carta che termina con ${last4} sta per scadere`;

    console.log(
      `[email] invio email carta in scadenza tramite Resend: to="${to}" from="${FROM_ADDRESS}" subject="${subject}"`
    );

    const { data, error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });

    if (error) {
      console.error(
        `[email] Resend ha risposto con un errore per l'email carta in scadenza a "${to}":`,
        JSON.stringify(error)
      );
      return;
    }

    console.log(
      `[email] email carta in scadenza inviata con successo a "${to}" (Resend id: ${data?.id ?? "n/d"}).`
    );
  } catch (error) {
    console.error(`[email] eccezione imprevista nell'invio email carta in scadenza a "${to}":`, error);
  }
}

/**
 * Email di autenticazione (reset password, Magic Link): come
 * sendPilotRequestConfirmationEmail, brand RecoverPulse fisso — è
 * RecoverPulse stesso a scrivere all'utente del proprio account, non un
 * merchant, quindi niente getMerchantSettings qui.
 */
function buildAuthEmailHtml({
  name,
  title,
  bodyHtml,
  ctaLabel,
  ctaLink,
  ttlLabel,
}: {
  name: string;
  title: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaLink: string;
  ttlLabel: string;
}): string {
  const safeName = escapeHtml(name);
  const firstName = safeName.split(" ")[0] || safeName;
  const safeCtaLink = escapeHtml(ctaLink);
  const preheader = `${title} — il link scade tra ${ttlLabel}.`;

  return `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:${FONT_STACK};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${preheader}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; width:100%;">

            <tr>
              <td align="center" style="padding-bottom:24px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:8px; vertical-align:middle;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="28" height="28" style="background-color:${RECOVERPULSE_BRAND_COLOR}; border-radius:8px;">
                        <tr><td align="center" valign="middle">${buildLogoMarkSvg("#052e21")}</td></tr>
                      </table>
                    </td>
                    <td style="vertical-align:middle; font-size:16px; font-weight:700; color:#18181b; letter-spacing:-0.01em;">
                      RecoverPulse
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e4e4e7; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                  <tr>
                    <td height="4" style="background-color:${RECOVERPULSE_BRAND_COLOR}; line-height:4px; font-size:4px;">&nbsp;</td>
                  </tr>

                  <tr>
                    <td style="padding:32px 32px 0 32px;">
                      <h1 style="margin:0 0 14px 0; font-size:21px; line-height:1.35; color:#18181b; font-weight:700;">
                        ${escapeHtml(title)}
                      </h1>
                      <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#3f3f46;">
                        Ciao ${firstName}, ${bodyHtml}
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 32px 8px 32px;" align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="border-radius:10px; background-color:${RECOVERPULSE_BRAND_COLOR};">
                            <a
                              href="${safeCtaLink}"
                              style="display:block; width:100%; box-sizing:border-box; color:#052e21; text-decoration:none; font-size:16px; font-weight:700; text-align:center; padding:15px 24px;"
                            >
                              ${escapeHtml(ctaLabel)} →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:14px 32px 32px 32px;">
                      <p style="margin:0; font-size:12.5px; line-height:1.6; color:#a1a1aa;">
                        Se il pulsante non funziona, copia e incolla questo link nel browser:<br />
                        <a href="${safeCtaLink}" style="color:#71717a; word-break:break-all;">${safeCtaLink}</a>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 32px; border-top:1px solid #e4e4e7; background-color:#fafafa;">
                      <p style="margin:0; font-size:12px; line-height:1.6; color:#a1a1aa;">
                        Il link scade tra ${ttlLabel}. Se non hai richiesto tu questa email, ignorala pure.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:24px 16px 0 16px;">
                <p style="margin:0; font-size:12px; line-height:1.6; color:#a1a1aa;">
                  Inviato da RecoverPulse su richiesta da recoverpulse.app.
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
 * Email di recupero password (/reset-password?token=...). Non propaga mai
 * errori — la route che la chiama (POST /api/auth/forgot-password) risponde
 * sempre con un messaggio generico indipendentemente dall'esito
 * dell'invio, per non rivelare quali email sono registrate.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetLink,
}: {
  to: string;
  name: string;
  resetLink: string;
}): Promise<void> {
  if (!to) return;

  try {
    const resend = await getResendClient();
    if (!resend) {
      console.warn("[email] Resend API Key non configurata: invio email di reset password saltato.");
      return;
    }

    const html = buildAuthEmailHtml({
      name,
      title: "Reimposta la tua password",
      bodyHtml: "abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account RecoverPulse. Clicca qui sotto per sceglierne una nuova.",
      ctaLabel: "Reimposta password",
      ctaLink: resetLink,
      ttlLabel: "1 ora",
    });
    const subject = "Reimposta la tua password RecoverPulse";

    console.log(`[email] invio email di reset password tramite Resend: to="${to}" from="${FROM_ADDRESS}"`);

    const { data, error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });

    if (error) {
      console.error(`[email] Resend ha risposto con un errore per il reset password a "${to}":`, JSON.stringify(error));
      return;
    }

    console.log(`[email] email di reset password inviata con successo a "${to}" (Resend id: ${data?.id ?? "n/d"}).`);
  } catch (error) {
    console.error(`[email] eccezione imprevista nell'invio del reset password a "${to}":`, error);
  }
}

/**
 * Email con il link Magic Link (/api/auth/magic-link/callback?token=...).
 * Stesso principio delle altre email di questo file: non propaga mai errori.
 */
export async function sendMagicLinkEmail({
  to,
  name,
  signInLink,
}: {
  to: string;
  name: string;
  signInLink: string;
}): Promise<void> {
  if (!to) return;

  try {
    const resend = await getResendClient();
    if (!resend) {
      console.warn("[email] Resend API Key non configurata: invio Magic Link saltato.");
      return;
    }

    const html = buildAuthEmailHtml({
      name,
      title: "Accedi a RecoverPulse",
      bodyHtml: "ecco il tuo link per accedere senza password. Clicca qui sotto per entrare nella dashboard.",
      ctaLabel: "Accedi a RecoverPulse",
      ctaLink: signInLink,
      ttlLabel: "15 minuti",
    });
    const subject = "Il tuo link di accesso a RecoverPulse";

    console.log(`[email] invio Magic Link tramite Resend: to="${to}" from="${FROM_ADDRESS}"`);

    const { data, error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });

    if (error) {
      console.error(`[email] Resend ha risposto con un errore per il Magic Link a "${to}":`, JSON.stringify(error));
      return;
    }

    console.log(`[email] Magic Link inviato con successo a "${to}" (Resend id: ${data?.id ?? "n/d"}).`);
  } catch (error) {
    console.error(`[email] eccezione imprevista nell'invio del Magic Link a "${to}":`, error);
  }
}

// Stessa struttura (header, card, footer) di buildAuthEmailHtml, ma con il
// codice OTP mostrato in chiaro al posto del pulsante CTA: qui non c'è un
// link da cliccare, l'utente deve ricopiare le 6 cifre nello Step 2 di
// /start-trial.
function buildOtpEmailHtml({ firstName, code, ttlLabel }: { firstName: string; code: string; ttlLabel: string }): string {
  const safeFirstName = escapeHtml(firstName);
  const safeCode = escapeHtml(code);
  const preheader = `Il tuo codice di attivazione RecoverPulse: ${code}`;

  return `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>Il tuo codice di attivazione RecoverPulse</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:${FONT_STACK};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${preheader}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; width:100%;">

            <tr>
              <td align="center" style="padding-bottom:24px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:8px; vertical-align:middle;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="28" height="28" style="background-color:${RECOVERPULSE_BRAND_COLOR}; border-radius:8px;">
                        <tr><td align="center" valign="middle">${buildLogoMarkSvg("#052e21")}</td></tr>
                      </table>
                    </td>
                    <td style="vertical-align:middle; font-size:16px; font-weight:700; color:#18181b; letter-spacing:-0.01em;">
                      RecoverPulse
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e4e4e7; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                  <tr>
                    <td height="4" style="background-color:${RECOVERPULSE_BRAND_COLOR}; line-height:4px; font-size:4px;">&nbsp;</td>
                  </tr>

                  <tr>
                    <td style="padding:32px 32px 0 32px;">
                      <h1 style="margin:0 0 14px 0; font-size:21px; line-height:1.35; color:#18181b; font-weight:700;">
                        Il tuo codice di attivazione
                      </h1>
                      <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#3f3f46;">
                        Ciao ${safeFirstName}, usa questo codice per completare la registrazione alla prova gratuita di RecoverPulse.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 32px 8px 32px;" align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="border-radius:10px; background-color:#fafafa; border:1px solid #e4e4e7; padding:18px 24px;">
                            <span style="font-size:32px; font-weight:700; letter-spacing:0.3em; color:#18181b; font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;">
                              ${safeCode}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:14px 32px 32px 32px;">
                      <p style="margin:0; font-size:12.5px; line-height:1.6; color:#a1a1aa;">
                        Inseriscilo nella schermata di attivazione da cui hai avviato la registrazione.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 32px; border-top:1px solid #e4e4e7; background-color:#fafafa;">
                      <p style="margin:0; font-size:12px; line-height:1.6; color:#a1a1aa;">
                        Il codice scade tra ${ttlLabel}. Se non hai richiesto tu questa email, ignorala pure.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:24px 16px 0 16px;">
                <p style="margin:0; font-size:12px; line-height:1.6; color:#a1a1aa;">
                  Inviato da RecoverPulse su richiesta da recoverpulse.app.
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
 * Email con il codice di attivazione a 6 cifre dello Step 2 di /start-trial
 * (vedi src/lib/trial-signup.ts). Non propaga mai errori: la route che la
 * chiama (POST /api/trial-signup/start) deve poter far avanzare comunque
 * l'utente allo Step 2 anche se l'invio fallisce, mostrando un errore solo
 * se in seguito il codice risulta davvero non recapitato.
 */
export async function sendTrialActivationCodeEmail({
  to,
  firstName,
  code,
}: {
  to: string;
  firstName: string;
  code: string;
}): Promise<void> {
  if (!to) return;

  try {
    const resend = await getResendClient();
    if (!resend) {
      console.warn("[email] Resend API Key non configurata: invio codice di attivazione saltato.");
      return;
    }

    const ttlLabel = "10 minuti";
    const html = buildOtpEmailHtml({ firstName, code, ttlLabel });
    const subject = `${code} è il tuo codice di attivazione RecoverPulse`;

    console.log(`[email] invio codice di attivazione tramite Resend: to="${to}" from="${FROM_ADDRESS}"`);

    const { data, error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });

    if (error) {
      console.error(`[email] Resend ha risposto con un errore per il codice di attivazione a "${to}":`, JSON.stringify(error));
      return;
    }

    console.log(`[email] codice di attivazione inviato con successo a "${to}" (Resend id: ${data?.id ?? "n/d"}).`);
  } catch (error) {
    console.error(`[email] eccezione imprevista nell'invio del codice di attivazione a "${to}":`, error);
  }
}
