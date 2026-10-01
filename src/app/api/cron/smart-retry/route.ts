import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  claimChargeRetry,
  listDueChargeRetries,
  markInvoiceRecovered,
  MAX_CHARGE_RETRIES,
  scheduleNextChargeRetry,
  type FailedTransaction,
} from "@/lib/transactions";
import { getStripeAccountIdForUser } from "@/lib/connected-stripe-accounts";
import { getStripeClientForAccount } from "@/lib/stripe";
import { getDunningTemplates } from "@/lib/dunning-templates";
import { stopDunningSequence } from "@/lib/dunning";
import { notifyPaymentRecovered } from "@/lib/notifications";
import { sendChargeRetryFailedEmail } from "@/lib/email";
import { getAppBaseUrl } from "@/lib/app-url";
import { requirePaymentSlots } from "@/lib/guardrails";

export const dynamic = "force-dynamic";

const HOUR_MS = 60 * 60 * 1000;

// Backoff esponenziale dopo il tentativo n (indice n-1): il primo tentativo è
// a +12h dal fallimento originale (pianificato dal webhook Stripe), poi +24h
// e +48h. Dopo MAX_CHARGE_RETRIES tentativi falliti si smette di riaddebitare:
// la fattura resta in mano alla sequenza di solleciti (cron/dunning).
const BACKOFF_AFTER_ATTEMPT_MS = [24 * HOUR_MS, 48 * HOUR_MS];

// Limite per esecuzione: il cron gira spesso, una coda arretrata viene
// smaltita nelle esecuzioni successive invece di sforare il timeout.
const BATCH_LIMIT = 50;

type Outcome = "recovered" | "failed" | "skipped";

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: currency.toUpperCase() }).format(
    amount / 100
  );
}

function formatAttemptDate(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(date);
}

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

async function markRecovered(transaction: FailedTransaction): Promise<void> {
  const updated = await markInvoiceRecovered(transaction.invoiceId, transaction.userId);
  if (updated) {
    await stopDunningSequence(updated);
    await notifyPaymentRecovered(updated);
  }
}

async function processTransaction(transaction: FailedTransaction): Promise<Outcome> {
  const slots = requirePaymentSlots("cron/smart-retry", {
    customerId: transaction.customerId,
    invoiceId: transaction.invoiceId,
    amount: transaction.amount,
    currency: transaction.currency,
  });
  if (!slots) {
    await scheduleNextChargeRetry(transaction.id, null);
    return "skipped";
  }

  const accountId = await getStripeAccountIdForUser(transaction.userId);
  if (!accountId) {
    console.warn(
      `[cron/smart-retry] fattura ${slots.invoiceId}: nessun account Stripe collegato per l'utente ${transaction.userId}, riaddebito annullato.`
    );
    await scheduleNextChargeRetry(transaction.id, null);
    return "skipped";
  }

  // Prenotazione atomica prima della chiamata a Stripe: se un'altra
  // esecuzione ha già preso questa fattura, `claimed` è null.
  const claimed = await claimChargeRetry(transaction);
  if (!claimed) return "skipped";

  const attempt = claimed.chargeRetryCount;
  const stripe = await getStripeClientForAccount(accountId);

  let declineMessage: string | null = null;
  try {
    const invoice = await stripe.invoices.pay(
      slots.invoiceId,
      {},
      { idempotencyKey: `omnirev-charge-retry:${slots.invoiceId}:${attempt}` }
    );
    if (invoice.status === "paid") {
      console.log(`[cron/smart-retry] fattura ${slots.invoiceId} recuperata al tentativo ${attempt}.`);
      await markRecovered(claimed);
      return "recovered";
    }
  } catch (error) {
    if (error instanceof Stripe.errors.StripeCardError) {
      declineMessage = error.message;
    } else {
      console.error(`[cron/smart-retry] errore Stripe sul riaddebito della fattura ${slots.invoiceId}:`, error);
    }

    // La fattura potrebbe essere stata saldata o annullata nel frattempo
    // (portale /pay, azione del merchant su Stripe): in quel caso non è un
    // fallimento da sollecitare.
    try {
      const current = await stripe.invoices.retrieve(slots.invoiceId);
      if (current.status === "paid") {
        await markRecovered(claimed);
        return "recovered";
      }
      if (current.status === "void" || current.status === "uncollectible") {
        console.log(
          `[cron/smart-retry] fattura ${slots.invoiceId} in stato "${current.status}" su Stripe: riaddebiti interrotti.`
        );
        await scheduleNextChargeRetry(claimed.id, null);
        return "skipped";
      }
    } catch (retrieveError) {
      console.error(`[cron/smart-retry] impossibile rileggere la fattura ${slots.invoiceId}:`, retrieveError);
    }
  }

  const nextAttemptAt =
    attempt < MAX_CHARGE_RETRIES ? new Date(Date.now() + BACKOFF_AFTER_ATTEMPT_MS[attempt - 1]) : null;
  await scheduleNextChargeRetry(claimed.id, nextAttemptAt);

  console.log(
    `[cron/smart-retry] riaddebito ${attempt}/${MAX_CHARGE_RETRIES} fallito per la fattura ${slots.invoiceId}: ${
      nextAttemptAt ? `prossimo tentativo ${nextAttemptAt.toISOString()}` : "tentativi esauriti"
    }.`
  );

  try {
    await sendChargeRetryFailedEmail({
      userId: claimed.userId,
      to: claimed.customerEmail,
      customerName: claimed.customerName,
      planName: claimed.planName,
      amountFormatted: formatAmount(slots.amount, slots.currency),
      recoveryLink: `${getAppBaseUrl()}/pay/${claimed.paymentLinkToken}`,
      failureReason: declineMessage ?? claimed.reason,
      nextAttemptLabel: nextAttemptAt ? formatAttemptDate(nextAttemptAt) : null,
    });
  } catch (error) {
    console.error(`[cron/smart-retry] invio dell'email di sollecito fallito per la fattura ${slots.invoiceId}:`, error);
  }

  return "failed";
}

/**
 * Riaddebito automatico delle fatture Stripe fallite via stripe.invoices.pay
 * (vedi 20261001120000_stripe_charge_retry.sql per il calendario). Distinto
 * da /api/cron/dunning, che invia solo solleciti email a giorni fissi.
 * Rispetta il toggle "Automazione" di /dashboard/dunning: con l'automazione
 * in pausa le fatture di quell'account restano in coda, senza consumare
 * tentativi. In caso di fallimento il cliente riceve l'email di recupero
 * React Email (src/components/emails/recovery-email.tsx); il webhook
 * invoice.payment_failed generato dallo stesso tentativo non rispedisce lo
 * step "immediate" (vedi handleInvoicePaymentFailed).
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  let due: FailedTransaction[];
  try {
    due = await listDueChargeRetries(new Date(), BATCH_LIMIT);
  } catch (error) {
    console.error("[cron/smart-retry] errore nel recupero dei riaddebiti pianificati:", error);
    return NextResponse.json({ error: "Errore nel recupero dei riaddebiti pianificati." }, { status: 500 });
  }

  const summary = { checked: due.length, recovered: 0, failed: 0, skipped: 0, paused: 0, errors: 0 };
  const automationByUser = new Map<string, boolean>();

  for (const transaction of due) {
    try {
      let automationEnabled = automationByUser.get(transaction.userId);
      if (automationEnabled === undefined) {
        automationEnabled = (await getDunningTemplates(transaction.userId)).automationEnabled;
        automationByUser.set(transaction.userId, automationEnabled);
      }
      if (!automationEnabled) {
        summary.paused++;
        continue;
      }

      summary[await processTransaction(transaction)]++;
    } catch (error) {
      console.error(`[cron/smart-retry] errore sulla fattura ${transaction.invoiceId}:`, error);
      summary.errors++;
    }
  }

  console.log("[cron/smart-retry] esecuzione completata:", summary);
  return NextResponse.json({ success: true, ...summary });
}
