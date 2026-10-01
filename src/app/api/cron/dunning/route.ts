import { NextResponse } from "next/server";

import { listActiveFailedTransactions, markInvoiceLost, clearNextRetryAt, type FailedTransaction } from "@/lib/transactions";
import { hasDunningLogForStep, recordDunningLog, SMART_RETRY_STEP_DAYS } from "@/lib/dunning-logs";
import { getDunningTemplates, type DunningTemplateStep } from "@/lib/dunning-templates";
import { sendDunningEmail, sendSddDunningEmail } from "@/lib/email";
import { getAppBaseUrl } from "@/lib/app-url";
import { listConnectedAccountUserIds } from "@/lib/connected-stripe-accounts";
import { listConnectedPaypalUserIds } from "@/lib/paypal-settings";
import { listConnectedGoCardlessUserIds } from "@/lib/connected-gocardless-accounts";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: currency.toUpperCase() }).format(
    amount / 100
  );
}

function daysElapsedSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

/**
 * `logStepDays` sovrascrive lo step_days registrato su dunning_logs rispetto
 * a `step.delayDays`: usato dal tentativo "smart retry" (SMART_RETRY_STEP_DAYS),
 * che riusa il template "first_reminder" per il contenuto dell'email ma non è
 * uno step reale del calendario a giorni fissi (vedi processAccount sotto).
 */
async function sendStepReminder(
  transaction: FailedTransaction,
  step: DunningTemplateStep,
  logStepDays: number = step.delayDays
): Promise<"sent" | "failed"> {
  let emailSent = false;
  try {
    const recoveryLink = `${getAppBaseUrl()}/pay/${transaction.paymentLinkToken}`;
    if (transaction.paymentMethodType === "sepa_debit") {
      await sendSddDunningEmail({
        userId: transaction.userId,
        to: transaction.customerEmail,
        customerName: transaction.customerName,
        planName: transaction.planName,
        amountFormatted: formatAmount(transaction.amount, transaction.currency),
        recoveryLink,
        ibanLast4: transaction.ibanLast4,
        failureReason: transaction.reason,
      });
    } else {
      await sendDunningEmail({
        userId: transaction.userId,
        to: transaction.customerEmail,
        customerName: transaction.customerName,
        planName: transaction.planName,
        amountFormatted: formatAmount(transaction.amount, transaction.currency),
        recoveryLink,
        stepId: step.id,
      });
    }
    emailSent = true;

    await recordDunningLog({
      userId: transaction.userId,
      invoiceId: transaction.invoiceId,
      stepDays: logStepDays,
      customerEmail: transaction.customerEmail,
      channel: "email",
      status: "sent",
      paymentMethodType: transaction.paymentMethodType,
    });
    return "sent";
  } catch (error) {
    if (emailSent) {
      // L'email è partita ma la scrittura del log è fallita: non ritentiamo
      // l'invio (rischio di duplicato), segnaliamo solo il problema di log.
      console.error(
        `[cron/dunning] sollecito "${step.label}" (T+${step.delayDays}g) inviato per la fattura ${transaction.invoiceId}, ma la registrazione del log su Supabase è fallita:`,
        error
      );
      return "sent";
    }

    console.error(
      `[cron/dunning] invio del sollecito "${step.label}" (T+${step.delayDays}g) fallito per la fattura ${transaction.invoiceId}:`,
      error
    );
    await recordDunningLog({
      userId: transaction.userId,
      invoiceId: transaction.invoiceId,
      stepDays: logStepDays,
      customerEmail: transaction.customerEmail,
      channel: "email",
      status: "failed",
      paymentMethodType: transaction.paymentMethodType,
    }).catch((logError) => {
      console.error(
        `[cron/dunning] impossibile registrare anche il fallimento del sollecito per la fattura ${transaction.invoiceId}:`,
        logError
      );
    });
    return "failed";
  }
}

type Summary = { checked: number; sent: number; skipped: number; failed: number; lost: number };

/** Un passaggio completo della sequenza di solleciti per un singolo account collegato. */
async function processAccount(userId: string): Promise<Summary> {
  const summary: Summary = { checked: 0, sent: 0, skipped: 0, failed: 0, lost: 0 };

  const templates = await getDunningTemplates(userId);
  if (!templates.automationEnabled) {
    return summary;
  }

  let transactions: FailedTransaction[];
  try {
    transactions = await listActiveFailedTransactions(userId);
  } catch (error) {
    console.error(`[cron/dunning] errore nel recupero delle transazioni in corso per l'utente ${userId}:`, error);
    return summary;
  }
  summary.checked = transactions.length;

  // Solo gli step con T+giorni > 0 e attivi riguardano il cron: lo step
  // "immediate" (T+0) è inviato subito dal webhook al momento del fallimento
  // del pagamento, non da questa esecuzione giornaliera.
  const reminderSteps = templates.steps.filter((step) => step.enabled && step.delayDays > 0);
  const maxDelayDays = reminderSteps.length > 0 ? Math.max(...reminderSteps.map((step) => step.delayDays)) : null;
  const smartRetryTemplateStep = templates.steps.find((step) => step.id === "first_reminder");
  const now = new Date();

  for (const transaction of transactions) {
    // Smart Retry & Error Categorization (src/lib/dunning-error-categorization.ts):
    // un next_retry_at scaduto forza un tentativo fuori dal calendario a
    // giorni fissi (insufficient_funds -> 1°/15° del mese, bank_system_error
    // -> 24-48h), indipendentemente da a che punto sia lo step normale.
    if (transaction.nextRetryAt && new Date(transaction.nextRetryAt) <= now && smartRetryTemplateStep) {
      try {
        // Una fattura registra al più un tentativo smart retry (vedi
        // SMART_RETRY_STEP_DAYS in src/lib/dunning-logs.ts): il controllo
        // evita di rispedire l'email se next_retry_at è scaduto una seconda
        // volta prima che clearNextRetryAt fosse riuscito ad azzerarlo.
        const alreadySent = await hasDunningLogForStep(transaction.invoiceId, SMART_RETRY_STEP_DAYS, userId);
        if (!alreadySent) {
          const outcome = await sendStepReminder(transaction, smartRetryTemplateStep, SMART_RETRY_STEP_DAYS);
          summary[outcome]++;
          console.log(
            `[cron/dunning] tentativo smart retry (${transaction.errorCategory}) per la fattura ${transaction.invoiceId}: ${outcome}.`
          );
        } else {
          summary.skipped++;
        }
        await clearNextRetryAt(transaction.invoiceId, userId);
      } catch (error) {
        console.error(`[cron/dunning] smart retry fallito per la fattura ${transaction.invoiceId}:`, error);
        summary.failed++;
      }
      continue;
    }

    // expired_card/invalid_card: il Magic Link è già partito con lo step
    // "immediate" (src/lib/dunning.ts) — niente ha senso ritentare
    // automaticamente un addebito su un metodo di pagamento invalido, si
    // aspetta un'azione del cliente. La fattura resta comunque soggetta al
    // timeout "perso" del template, come le altre.
    if (transaction.retryBypassed) {
      const elapsedDays = daysElapsedSince(transaction.createdAt);
      if (maxDelayDays !== null && elapsedDays > maxDelayDays) {
        try {
          const lost = await markInvoiceLost(transaction.invoiceId, userId);
          if (lost) {
            console.log(
              `[cron/dunning] fattura ${transaction.invoiceId} segnata come "perso": metodo di pagamento non valido, nessuna azione del cliente dopo ${maxDelayDays} giorni.`
            );
            summary.lost++;
            continue;
          }
        } catch (error) {
          console.error(
            `[cron/dunning] impossibile segnare come "perso" la fattura ${transaction.invoiceId}:`,
            error
          );
          summary.failed++;
          continue;
        }
      }
      summary.skipped++;
      continue;
    }

    const elapsedDays = daysElapsedSince(transaction.createdAt);
    const step = reminderSteps.find((candidate) => candidate.delayDays === elapsedDays);

    if (!step) {
      if (maxDelayDays !== null && elapsedDays > maxDelayDays) {
        try {
          const lost = await markInvoiceLost(transaction.invoiceId, userId);
          if (lost) {
            console.log(
              `[cron/dunning] fattura ${transaction.invoiceId} segnata come "perso": sequenza di solleciti esaurita dopo ${maxDelayDays} giorni senza recupero.`
            );
            summary.lost++;
            continue;
          }
        } catch (error) {
          console.error(
            `[cron/dunning] impossibile segnare come "perso" la fattura ${transaction.invoiceId}:`,
            error
          );
          summary.failed++;
          continue;
        }
      }
      summary.skipped++;
      continue;
    }

    let alreadySent: boolean;
    try {
      alreadySent = await hasDunningLogForStep(transaction.invoiceId, step.delayDays, userId);
    } catch (error) {
      console.error(
        `[cron/dunning] impossibile verificare i solleciti già inviati per la fattura ${transaction.invoiceId}:`,
        error
      );
      summary.failed++;
      continue;
    }

    if (alreadySent) {
      summary.skipped++;
      continue;
    }

    const outcome = await sendStepReminder(transaction, step);
    summary[outcome]++;
  }

  return summary;
}

/**
 * Sequenza automatica di solleciti, eseguita una volta al giorno da Vercel
 * Cron (vedi vercel.json), un passaggio per ciascun account collegato
 * (Stripe, PayPal e/o GoCardless: un merchant può averne anche solo uno,
 * l'unione dei tre elenchi evita di escludere i merchant senza Stripe, bug
 * corretto in questa revisione) — ognuno con i propri template
 * (/dashboard/dunning) e le proprie transazioni: due account non condividono
 * più né configurazione né dati. Rispetta l'automazione di ogni account: se
 * in pausa, quell'account viene saltato senza fermare gli altri. Per ogni
 * fattura ancora 'in_corso', se i giorni trascorsi dalla creazione
 * coincidono con lo step (T+giorni) di uno step attivo diverso da
 * "immediate" (già gestito subito dal webhook, vedi src/lib/dunning.ts),
 * invia il sollecito via email con il link al portale /pay/[token],
 * registrando l'invio in dunning_logs per non spedirlo due volte. Superato
 * lo step attivo più lontano nel tempo senza che il pagamento sia stato
 * recuperato, la fattura viene segnata come 'perso'. Rispetta inoltre gli
 * override di Smart Retry (next_retry_at/retry_bypassed, vedi processAccount).
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  let userIds: string[];
  try {
    const [stripeUserIds, paypalUserIds, gocardlessUserIds] = await Promise.all([
      listConnectedAccountUserIds(),
      listConnectedPaypalUserIds(),
      listConnectedGoCardlessUserIds(),
    ]);
    userIds = [...new Set([...stripeUserIds, ...paypalUserIds, ...gocardlessUserIds])];
  } catch (error) {
    console.error("[cron/dunning] errore nel recupero degli account collegati:", error);
    return NextResponse.json({ error: "Errore nel recupero degli account collegati." }, { status: 500 });
  }

  const total: Summary = { checked: 0, sent: 0, skipped: 0, failed: 0, lost: 0 };

  for (const userId of userIds) {
    const accountSummary = await processAccount(userId);
    total.checked += accountSummary.checked;
    total.sent += accountSummary.sent;
    total.skipped += accountSummary.skipped;
    total.failed += accountSummary.failed;
    total.lost += accountSummary.lost;
  }

  console.log(`[cron/dunning] esecuzione completata su ${userIds.length} account:`, total);
  return NextResponse.json({ success: true, accounts: userIds.length, ...total });
}
