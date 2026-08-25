import "server-only";
import { Resend } from "resend";

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "RecoverPulse <onboarding@resend.dev>";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function buildDunningEmailHtml({
  customerName,
  planName,
  amountFormatted,
  recoveryLink,
}: {
  customerName: string;
  planName: string;
  amountFormatted: string;
  recoveryLink: string;
}): string {
  return `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Aggiorna il tuo metodo di pagamento</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e4e4e7;">
            <tr>
              <td style="padding:32px 32px 0 32px;">
                <p style="margin:0 0 24px 0; font-size:15px; font-weight:700; color:#18181b; letter-spacing:-0.01em;">RecoverPulse</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <h1 style="margin:0 0 16px 0; font-size:20px; line-height:1.4; color:#18181b;">Il pagamento non è andato a buon fine</h1>
                <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#3f3f46;">
                  ${customerName && customerName !== "Gentile cliente" ? `Ciao ${customerName}` : "Gentile cliente"}, non siamo riusciti ad addebitare
                  <strong>${amountFormatted}</strong> per il piano <strong>${planName}</strong>.
                  Aggiorna il tuo metodo di pagamento per evitare l'interruzione del servizio.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px 32px;" align="center">
                <a
                  href="${recoveryLink}"
                  style="display:inline-block; width:100%; box-sizing:border-box; background-color:#18181b; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; text-align:center; padding:14px 24px; border-radius:8px;"
                >
                  Aggiorna metodo di pagamento
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;">
                <p style="margin:0; font-size:13px; line-height:1.6; color:#a1a1aa;">
                  Se il pulsante non funziona, copia e incolla questo link nel browser:<br />
                  <a href="${recoveryLink}" style="color:#71717a; word-break:break-all;">${recoveryLink}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; border-top:1px solid #e4e4e7; background-color:#fafafa;">
                <p style="margin:0; font-size:12px; line-height:1.6; color:#a1a1aa;">
                  Il link è valido 7 giorni e utilizzabile una sola volta. Se hai già aggiornato il pagamento, ignora questa email.
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
}: {
  to: string;
  customerName: string;
  planName: string;
  amountFormatted: string;
  recoveryLink: string;
}): Promise<void> {
  if (!to) {
    console.warn("[email] invio saltato: email cliente mancante.");
    return;
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY non configurata: invio email di dunning saltato.");
    return;
  }

  const html = buildDunningEmailHtml({ customerName, planName, amountFormatted, recoveryLink });
  const subject = `Azione richiesta: aggiorna il metodo di pagamento per ${planName}`;

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
