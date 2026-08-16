import type { FailedTransaction } from "@/lib/transactions";
import { getDunningSettings, type DunningChannel } from "@/lib/dunning-settings";

export type { DunningChannel };

/**
 * Avvia la sequenza dunning (WhatsApp -> SMS -> Email) per una fattura fallita,
 * rispettando i canali attivati in Impostazioni > Sequenze Dunning.
 * TODO: collegare i provider reali (es. WhatsApp Business API / Twilio per SMS / Resend per Email)
 * usando le credenziali del cliente una volta disponibili.
 */
export async function startDunningSequence(transaction: FailedTransaction) {
  const settings = getDunningSettings();
  const channels = (["whatsapp", "sms", "email"] as DunningChannel[]).filter(
    (channel) => settings.channels[channel]
  );
  const portalPath = `/pay/${transaction.paymentLinkToken}`;

  if (channels.length === 0) {
    console.log(
      `[dunning] nessun canale attivo: sequenza per fattura ${transaction.invoiceId} non avviata.`
    );
    return;
  }

  console.log(
    `[dunning] avvio sequenza per fattura ${transaction.invoiceId} (${transaction.customerEmail}) su canali: ${channels.join(", ")} — link portale: ${portalPath}`
  );

  // Placeholder: qui andrà l'invio effettivo del primo messaggio della sequenza,
  // con il link al portale 1-click (portalPath) incluso nel testo.
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
