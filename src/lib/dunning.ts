import type { FailedTransaction } from "@/lib/transactions";
import { getDunningSettings, type DunningChannel } from "@/lib/dunning-settings";
import { sendDunningEmail } from "@/lib/email";

export type { DunningChannel };

// I link inviati via email devono sempre puntare al dominio di produzione,
// indipendentemente dall'ambiente in cui gira il webhook (anche in locale).
function getAppBaseUrl(): string {
  return "https://recoverpulse-three.vercel.app";
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: currency.toUpperCase() }).format(
    amount / 100
  );
}

/**
 * Avvia la sequenza dunning (WhatsApp -> SMS -> Email) per una fattura fallita,
 * rispettando i canali attivati in Impostazioni > Sequenze Dunning.
 * TODO: collegare i provider reali per WhatsApp Business API e SMS (Twilio)
 * usando le credenziali del cliente una volta disponibili.
 */
export async function startDunningSequence(transaction: FailedTransaction) {
  const settings = getDunningSettings();
  const channels = (["whatsapp", "sms", "email"] as DunningChannel[]).filter(
    (channel) => settings.channels[channel]
  );
  const portalPath = `/pay/${transaction.paymentLinkToken}`;
  const recoveryLink = `${getAppBaseUrl()}${portalPath}`;

  if (channels.length === 0) {
    console.log(
      `[dunning] nessun canale attivo: sequenza per fattura ${transaction.invoiceId} non avviata.`
    );
    return;
  }

  console.log(
    `[dunning] avvio sequenza per fattura ${transaction.invoiceId} (${transaction.customerEmail}) su canali: ${channels.join(", ")} — link portale: ${portalPath}`
  );

  if (channels.includes("email")) {
    await sendDunningEmail({
      to: transaction.customerEmail,
      customerName: transaction.customerName,
      planName: transaction.planName,
      amountFormatted: formatAmount(transaction.amount, transaction.currency),
      recoveryLink,
    });
  }

  // Placeholder: qui andrà l'invio effettivo dei messaggi WhatsApp/SMS della
  // sequenza, con il link al portale 1-click (recoveryLink) incluso nel testo.
}

/**
 * Interrompe la sequenza dunning per una fattura, tipicamente perché il pagamento è stato recuperato.
 * TODO: cancellare eventuali job/reminder pianificati presso i provider di notifica.
 */
export async function stopDunningSequence(transaction: FailedTransaction) {
  console.log(
    `[dunning] interrotta sequenza per fattura ${transaction.invoiceId} (${transaction.customerEmail}): pagamento recuperato`
  );
}
