import type { FailedTransaction } from "@/lib/transactions";
import { getDunningSettings, type DunningChannel } from "@/lib/dunning-settings";
import { getDunningTemplates } from "@/lib/dunning-templates";
import { sendDunningEmail } from "@/lib/email";
import { getAppBaseUrl } from "@/lib/app-url";

export type { DunningChannel };

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: currency.toUpperCase() }).format(
    amount / 100
  );
}

/**
 * Avvia il primo step ("immediate") della sequenza dunning per una fattura
 * fallita, rispettando sia il toggle "Automazione" sia lo step stesso
 * configurati in /dashboard/dunning, oltre ai canali attivati in
 * Impostazioni > Sequenze Dunning.
 *
 * Solo il canale email è realmente implementato: WhatsApp e SMS non sono
 * ancora disponibili (nessuna integrazione Twilio/WhatsApp Business API), per
 * questo il relativo toggle in /dashboard/sequenze è disabilitato — vedi
 * DunningChannel e src/components/dashboard/dunning-sequences-panel.tsx.
 *
 * `skipAutomationGate` bypassa i controlli su automazione/step attivo: usato
 * dal pulsante "Sollecito" della dashboard transazioni
 * (src/app/api/dashboard/transactions/[invoiceId]/resend/route.ts), dove
 * l'invio è un'azione manuale ed esplicita dell'operatore, non deve dipendere
 * dal fatto che l'automazione sia in pausa.
 */
export async function startDunningSequence(
  transaction: FailedTransaction,
  options: { skipAutomationGate?: boolean } = {}
) {
  const templates = await getDunningTemplates();
  if (!options.skipAutomationGate) {
    if (!templates.automationEnabled) {
      console.log(
        `[dunning] automazione in pausa da /dashboard/dunning: sequenza per fattura ${transaction.invoiceId} non avviata.`
      );
      return;
    }

    const immediateStep = templates.steps.find((step) => step.id === "immediate");
    if (!immediateStep?.enabled) {
      console.log(
        `[dunning] step "Sollecito Immediato" disattivato da /dashboard/dunning: nessuna email inviata subito per la fattura ${transaction.invoiceId}.`
      );
      return;
    }
  }

  const settings = await getDunningSettings();
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
      stepId: "immediate",
    });
  }
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
