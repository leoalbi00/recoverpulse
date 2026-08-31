import { NextResponse } from "next/server";

import { listActiveFailedTransactions, markInvoiceLost, type FailedTransaction } from "@/lib/transactions";
import { hasDunningLogForStep, recordDunningLog } from "@/lib/dunning-logs";
import { getDunningTemplates, type DunningTemplateStep } from "@/lib/dunning-templates";
import { sendDunningEmail } from "@/lib/email";
import { getAppBaseUrl } from "@/lib/app-url";

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

async function sendStepReminder(transaction: FailedTransaction, step: DunningTemplateStep): Promise<"sent" | "failed"> {
  let emailSent = false;
  try {
    const recoveryLink = `${getAppBaseUrl()}/pay/${transaction.paymentLinkToken}`;
    await sendDunningEmail({
      to: transaction.customerEmail,
      customerName: transaction.customerName,
      planName: transaction.planName,
      amountFormatted: formatAmount(transaction.amount, transaction.currency),
      recoveryLink,
      stepId: step.id,
    });
    emailSent = true;

    await recordDunningLog({
      invoiceId: transaction.invoiceId,
      stepDays: step.delayDays,
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
      invoiceId: transaction.invoiceId,
      stepDays: step.delayDays,
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
 * Cron (vedi vercel.json). Rispetta i template configurati in
 * /dashboard/dunning (src/lib/dunning-templates.ts): se l'automazione è in
 * pausa, l'esecuzione si ferma subito; altrimenti, per ogni fattura ancora
 * 'in_corso' su Supabase, se i giorni trascorsi dalla creazione coincidono
 * con lo step (T+giorni) di uno step attivo diverso da "immediate" (già
 * gestito subito dal webhook, vedi src/lib/dunning.ts), invia il sollecito
 * via email con il link al portale /pay/[token], registrando l'invio in
 * dunning_logs per non spedirlo due volte. Superato lo step attivo più
 * lontano nel tempo senza che il pagamento sia stato recuperato, la fattura
 * viene segnata come 'perso'.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const templates = await getDunningTemplates();
  if (!templates.automationEnabled) {
    console.log("[cron/dunning] automazione in pausa da /dashboard/dunning: esecuzione saltata.");
    return NextResponse.json({ success: true, paused: true, checked: 0, sent: 0, skipped: 0, failed: 0, lost: 0 });
  }

  let transactions: FailedTransaction[];
  try {
    transactions = await listActiveFailedTransactions();
  } catch (error) {
    console.error("[cron/dunning] errore nel recupero delle transazioni in corso:", error);
    return NextResponse.json({ error: "Errore nel recupero delle transazioni." }, { status: 500 });
  }

  // Solo gli step con T+giorni > 0 e attivi riguardano il cron: lo step
  // "immediate" (T+0) è inviato subito dal webhook al momento del fallimento
  // del pagamento, non da questa esecuzione giornaliera.
  const reminderSteps = templates.steps.filter((step) => step.enabled && step.delayDays > 0);
  const maxDelayDays = reminderSteps.length > 0 ? Math.max(...reminderSteps.map((step) => step.delayDays)) : null;

  const summary = { checked: transactions.length, sent: 0, skipped: 0, failed: 0, lost: 0 };

  for (const transaction of transactions) {
    const elapsedDays = daysElapsedSince(transaction.createdAt);
    const step = reminderSteps.find((candidate) => candidate.delayDays === elapsedDays);

    if (!step) {
      if (maxDelayDays !== null && elapsedDays > maxDelayDays) {
        try {
          const lost = await markInvoiceLost(transaction.invoiceId);
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
      alreadySent = await hasDunningLogForStep(transaction.invoiceId, step.delayDays);
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

  console.log("[cron/dunning] esecuzione completata:", summary);
  return NextResponse.json({ success: true, ...summary });
}
