import { markFirstNoticeSent, type FailedTransaction } from "@/lib/transactions";
import { getDunningSettings, type DunningChannel } from "@/lib/dunning-settings";
import { getDunningTemplates } from "@/lib/dunning-templates";
import { recordDunningLog } from "@/lib/dunning-logs";
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
 * fallita, rispettando sia il toggle "Automazione" sia lo step stesso, oltre
 * al canale Email attivato, tutti configurati nei tab di /dashboard/dunning
 * (src/components/dashboard/dunning-channel-tabs.tsx).
 *
 * Solo il canale email è realmente implementato: WhatsApp e SMS restano tab
 * di anteprima ("In arrivo") perché non esiste ancora un'integrazione
 * Twilio/WhatsApp Business API — vedi DunningChannel e
 * src/components/dashboard/dunning-channel-tabs.tsx.
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
  const templates = await getDunningTemplates(transaction.userId);
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
        `[dunning] step "Primo Sollecito" disattivato da /dashboard/dunning: nessuna email inviata subito per la fattura ${transaction.invoiceId}.`
      );
      return;
    }
  }

  const settings = await getDunningSettings(transaction.userId);
  const channels = (["whatsapp", "sms", "email"] as DunningChannel[]).filter(
    (channel) => settings.channels[channel]
  );
  // Link di recupero: il portale RecoverPulse (1-click, monouso, tracciato)
  // resta la scelta primaria; il link Stripe hosted_invoice_url è solo un
  // fallback per il raro caso in cui il token del portale non sia
  // disponibile (createPaymentToken fallito a monte).
  const portalPath = transaction.paymentLinkToken ? `/pay/${transaction.paymentLinkToken}` : null;
  const recoveryLink = portalPath
    ? `${getAppBaseUrl()}${portalPath}`
    : (transaction.hostedInvoiceUrl ?? getAppBaseUrl());

  if (channels.length === 0) {
    console.log(
      `[dunning] nessun canale attivo: sequenza per fattura ${transaction.invoiceId} non avviata.`
    );
    return;
  }

  console.log(
    `[dunning] avvio sequenza per fattura ${transaction.invoiceId} (${transaction.customerEmail}) su canali: ${channels.join(", ")} — link di recupero: ${recoveryLink}`
  );

  if (channels.includes("email")) {
    // La fattura è già registrata su Supabase a questo punto (vedi
    // handleInvoicePaymentFailed nel webhook): un fallimento dell'invio non
    // deve far fallire l'intero webhook e farlo ritentare da Stripe, il
    // sollecito successivo del cron proverà comunque a raggiungere il
    // cliente.
    let emailSent = false;
    try {
      await sendDunningEmail({
        userId: transaction.userId,
        to: transaction.customerEmail,
        customerName: transaction.customerName,
        planName: transaction.planName,
        amountFormatted: formatAmount(transaction.amount, transaction.currency),
        recoveryLink,
        stepId: "immediate",
      });
      emailSent = true;
    } catch (error) {
      console.error(
        `[dunning] invio dell'email immediata fallito per la fattura ${transaction.invoiceId}: la fattura resta comunque registrata e recuperabile dal portale.`,
        error
      );
    }

    // Traccia il tentativo su dunning_logs (letto da /dashboard/transazioni
    // per le colonne "Tentativi Dunning"/"Ultima Azione", src/lib/dunning-logs.ts
    // getDunningLogSummaries): a differenza degli step successivi, inviati e
    // registrati dal cron (src/app/api/cron/dunning/route.ts), questo è
    // l'unico punto che invia lo step "immediate" (T+0, delayDays 0), quindi
    // senza questa chiamata la dashboard non mostrerebbe mai il primo
    // sollecito appena inviato. Il vincolo unique (invoice_id, step_days) fa
    // sì che eventuali reinvii manuali dello stesso step (pulsante
    // "Sollecito" su /dashboard/transazioni) non producano righe duplicate.
    try {
      await recordDunningLog({
        userId: transaction.userId,
        invoiceId: transaction.invoiceId,
        stepDays: 0,
        customerEmail: transaction.customerEmail,
        channel: "email",
        status: emailSent ? "sent" : "failed",
      });
    } catch (error) {
      console.error(
        `[dunning] impossibile registrare il log del sollecito immediato per la fattura ${transaction.invoiceId}:`,
        error
      );
    }

    if (!emailSent) return;

    // first_notice_sent_at è puramente informativo (dashboard/audit): non
    // tocca `status`, che resta "in_corso" perché continua a guidare il cron
    // di dunning per i solleciti successivi (first_reminder, final_notice) e
    // il portale /pay. Un fallimento qui non deve far fallire il webhook: la
    // mail è già stata inviata, l'unico effetto è una data mancante in
    // dashboard.
    try {
      await markFirstNoticeSent(transaction.invoiceId, transaction.userId);
    } catch (error) {
      console.error(
        `[dunning] impossibile registrare first_notice_sent_at per la fattura ${transaction.invoiceId}:`,
        error
      );
    }
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
