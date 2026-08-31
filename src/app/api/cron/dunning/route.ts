import { NextResponse } from "next/server";

import { listActiveFailedTransactions, markInvoiceLost, type FailedTransaction } from "@/lib/transactions";
import { hasDunningLogForStep, recordDunningLog } from "@/lib/dunning-logs";
import { sendDunningEmail } from "@/lib/email";
import { getAppBaseUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";

// Sequenza di solleciti via email: numero di giorni trascorsi dalla creazione
// della fattura fallita ai quali va inviato il prossimo promemoria.
const DUNNING_STEP_DAYS = [3, 7, 14] as const;

// Oltre l'ultimo step la sequenza di solleciti è esaurita: se la fattura è
// ancora 'in_corso' a questo punto, il recupero viene considerato fallito.
const DUNNING_MAX_STEP_DAYS = DUNNING_STEP_DAYS[DUNNING_STEP_DAYS.length - 1];

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

async function sendStepReminder(transaction: FailedTransaction, stepDays: number): Promise<"sent" | "failed"> {
  let emailSent = false;
  try {
    const recoveryLink = `${getAppBaseUrl()}/pay/${transaction.paymentLinkToken}`;
    await sendDunningEmail({
      to: transaction.customerEmail,
      customerName: transaction.customerName,
      planName: transaction.planName,
      amountFormatted: formatAmount(transaction.amount, transaction.currency),
      recoveryLink,
      isFinalNotice: stepDays === DUNNING_STEP_DAYS[DUNNING_STEP_DAYS.length - 1],
    });
    emailSent = true;

    await recordDunningLog({
      invoiceId: transaction.invoiceId,
      stepDays,
      customerEmail: transaction.customerEmail,
      channel: "email",
      status: "sent",
    });
    return "sent";
  } catch (error) {
    if (emailSent) {
      // L'email è partita ma la scrittura del log è fallita: non ritentiamo
      // l'invio (rischio di duplicato), segnaliamo solo il problema di log.
      console.error(
        `[cron/dunning] sollecito a ${stepDays} giorni inviato per la fattura ${transaction.invoiceId}, ma la registrazione del log su Supabase è fallita:`,
        error
      );
      return "sent";
    }

    console.error(
      `[cron/dunning] invio del sollecito a ${stepDays} giorni fallito per la fattura ${transaction.invoiceId}:`,
      error
    );
    await recordDunningLog({
      invoiceId: transaction.invoiceId,
      stepDays,
      customerEmail: transaction.customerEmail,
      channel: "email",
      status: "failed",
    }).catch((logError) => {
      console.error(
        `[cron/dunning] impossibile registrare anche il fallimento del sollecito per la fattura ${transaction.invoiceId}:`,
        logError
      );
    });
    return "failed";
  }
}

/**
 * Sequenza automatica di solleciti, eseguita una volta al giorno da Vercel
 * Cron (vedi vercel.json). Per ogni fattura ancora 'in_corso' su Supabase,
 * se i giorni trascorsi dalla creazione coincidono con uno degli step
 * previsti (3, 7, 14 giorni) invia il sollecito via email con il link al
 * portale /pay/[token], registrando l'invio in dunning_logs per non
 * spedirlo due volte. Superato l'ultimo step senza che il pagamento sia
 * stato recuperato, la fattura viene segnata come 'perso'.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  let transactions: FailedTransaction[];
  try {
    transactions = await listActiveFailedTransactions();
  } catch (error) {
    console.error("[cron/dunning] errore nel recupero delle transazioni in corso:", error);
    return NextResponse.json({ error: "Errore nel recupero delle transazioni." }, { status: 500 });
  }

  const summary = { checked: transactions.length, sent: 0, skipped: 0, failed: 0, lost: 0 };

  for (const transaction of transactions) {
    const elapsedDays = daysElapsedSince(transaction.createdAt);
    const stepDays = DUNNING_STEP_DAYS.find((days) => days === elapsedDays);

    if (stepDays === undefined) {
      if (elapsedDays > DUNNING_MAX_STEP_DAYS) {
        try {
          const lost = await markInvoiceLost(transaction.invoiceId);
          if (lost) {
            console.log(
              `[cron/dunning] fattura ${transaction.invoiceId} segnata come "perso": sequenza di solleciti esaurita dopo ${DUNNING_MAX_STEP_DAYS} giorni senza recupero.`
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
      alreadySent = await hasDunningLogForStep(transaction.invoiceId, stepDays);
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

    const outcome = await sendStepReminder(transaction, stepDays);
    summary[outcome]++;
  }

  console.log("[cron/dunning] esecuzione completata:", summary);
  return NextResponse.json({ success: true, ...summary });
}
