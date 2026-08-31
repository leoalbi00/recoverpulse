import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type TransactionStatus = "in_corso" | "recuperato" | "perso";

export type FailedTransaction = {
  id: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subscriptionId: string | null;
  planName: string;
  amount: number;
  currency: string;
  reason: string;
  status: TransactionStatus;
  paymentLinkToken: string;
  /** Link Stripe alla fattura ospitata (invoice.hosted_invoice_url), se disponibile. */
  hostedInvoiceUrl: string | null;
  createdAt: string;
  recoveredAt: string | null;
};

type FailedTransactionRow = {
  id: string;
  invoice_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  subscription_id: string | null;
  plan_name: string;
  amount: number;
  currency: string;
  reason: string;
  status: TransactionStatus;
  payment_link_token: string;
  hosted_invoice_url: string | null;
  created_at: string;
  recovered_at: string | null;
};

function mapRow(row: FailedTransactionRow): FailedTransaction {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    subscriptionId: row.subscription_id,
    planName: row.plan_name,
    amount: row.amount,
    currency: row.currency,
    reason: row.reason,
    status: row.status,
    paymentLinkToken: row.payment_link_token,
    hostedInvoiceUrl: row.hosted_invoice_url,
    createdAt: row.created_at,
    recoveredAt: row.recovered_at,
  };
}

/**
 * Registra (o aggiorna) una fattura fallita su Supabase. L'upsert avviene su
 * `invoice_id`: `id` e `created_at` restano quelli della riga esistente (non
 * sono inclusi nel payload), mentre stato ed esito di recupero vengono sempre
 * ripristinati a "in corso" perché rappresentano un nuovo fallimento.
 */
export async function recordFailedPayment(input: {
  invoiceId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subscriptionId: string | null;
  planName: string;
  amount: number;
  currency: string;
  reason: string;
  /** Token monouso (in chiaro) generato su Supabase da `createPaymentToken` per il link del portale. */
  paymentLinkToken: string;
  /** Link Stripe alla fattura ospitata (invoice.hosted_invoice_url), se disponibile. */
  hostedInvoiceUrl?: string | null;
}): Promise<FailedTransaction> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .upsert(
      {
        invoice_id: input.invoiceId,
        customer_id: input.customerId,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        subscription_id: input.subscriptionId,
        plan_name: input.planName,
        amount: input.amount,
        currency: input.currency,
        reason: input.reason,
        payment_link_token: input.paymentLinkToken,
        hosted_invoice_url: input.hostedInvoiceUrl ?? null,
        status: "in_corso" satisfies TransactionStatus,
        recovered_at: null,
      },
      { onConflict: "invoice_id" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Errore nella registrazione del pagamento fallito su Supabase: ${error.message}`);
  }

  return mapRow(data);
}

export async function markInvoiceRecovered(invoiceId: string): Promise<FailedTransaction | null> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .update({ status: "recuperato" satisfies TransactionStatus, recovered_at: new Date().toISOString() })
    .eq("invoice_id", invoiceId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nell'aggiornamento della transazione recuperata su Supabase: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

/**
 * Segna come "perso" una singola fattura ancora in corso, tipicamente
 * chiamata dal cron di dunning (src/app/api/cron/dunning/route.ts) quando i
 * giorni trascorsi superano l'ultimo step della sequenza di solleciti senza
 * che il pagamento sia stato recuperato. Il filtro su status "in_corso"
 * rende la chiamata idempotente tra esecuzioni successive del cron.
 */
export async function markInvoiceLost(invoiceId: string): Promise<FailedTransaction | null> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .update({ status: "perso" satisfies TransactionStatus })
    .eq("invoice_id", invoiceId)
    .eq("status", "in_corso")
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nell'aggiornamento della fattura persa su Supabase: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

/**
 * Segna come "perso" ogni recupero ancora in corso legato a uno Stripe
 * Subscription ID, tipicamente in risposta a customer.subscription.deleted:
 * una volta cancellato l'abbonamento non ha più senso proseguire la
 * sequenza di dunning sulle sue fatture non pagate.
 */
export async function markSubscriptionLost(subscriptionId: string): Promise<FailedTransaction[]> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .update({ status: "perso" satisfies TransactionStatus })
    .eq("subscription_id", subscriptionId)
    .eq("status", "in_corso")
    .select();

  if (error) {
    throw new Error(`Errore nell'aggiornamento delle transazioni perse su Supabase: ${error.message}`);
  }

  return (data ?? []).map(mapRow);
}

export async function getTransaction(invoiceId: string): Promise<FailedTransaction | null> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .select("*")
    .eq("invoice_id", invoiceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Errore nella lettura della transazione su Supabase: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

/**
 * Risolve la transazione di pagamento fallito più recente non ancora recuperata
 * per uno Stripe Customer ID. Usata da `/pay/[token]`: il token del portale
 * (validato su Supabase) porta con sé solo il `customerId`, non l'invoiceId.
 */
export async function getTransactionByCustomerId(customerId: string): Promise<FailedTransaction | null> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Errore nella ricerca della transazione su Supabase: ${error.message}`);
  }

  if (!data || data.length === 0) return null;

  const active = data.find((row) => row.status === "in_corso");
  return mapRow(active ?? data[0]);
}

export async function listTransactions(): Promise<FailedTransaction[]> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Errore nel recupero delle transazioni su Supabase: ${error.message}`);
  }

  return (data ?? []).map(mapRow);
}

/**
 * Fatture ancora in corso di recupero, usata dal cron dei solleciti
 * (src/app/api/cron/dunning/route.ts) per valutare, fattura per fattura, se è
 * il momento di inviare il prossimo sollecito della sequenza.
 */
export async function listActiveFailedTransactions(): Promise<FailedTransaction[]> {
  const { data, error } = await supabaseAdmin
    .from("failed_transactions")
    .select("*")
    .eq("status", "in_corso")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Errore nel recupero delle transazioni in corso su Supabase: ${error.message}`);
  }

  return (data ?? []).map(mapRow);
}

export type DashboardStats = {
  totalCount: number;
  recoveredCount: number;
  activeFailedCount: number;
  lostCount: number;
  recoveredAmount: number;
  recoveryRate: number;
  currency: string;
};

export function computeDashboardStats(all: FailedTransaction[]): DashboardStats {
  const recovered = all.filter((t) => t.status === "recuperato");
  const active = all.filter((t) => t.status === "in_corso");
  const lost = all.filter((t) => t.status === "perso");

  return {
    totalCount: all.length,
    recoveredCount: recovered.length,
    activeFailedCount: active.length,
    lostCount: lost.length,
    recoveredAmount: recovered.reduce((sum, t) => sum + t.amount, 0),
    recoveryRate: all.length > 0 ? Math.round((recovered.length / all.length) * 100) : 0,
    currency: all[0]?.currency ?? "usd",
  };
}

export type RecoveryChartPoint = {
  day: string;
  recovered: number;
  failed: number;
};

export function computeRecoveryChartData(all: FailedTransaction[], days = 14): RecoveryChartPoint[] {
  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getTime() - (days - 1 - index) * dayMs);
    return {
      key: date.toISOString().slice(0, 10),
      day: new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" }).format(date),
      recovered: 0,
      failed: 0,
    };
  });

  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const transaction of all) {
    const failedBucket = byKey.get(transaction.createdAt.slice(0, 10));
    if (failedBucket) failedBucket.failed += Math.round((transaction.amount / 100) * 100) / 100;

    if (transaction.status === "recuperato" && transaction.recoveredAt) {
      const recoveredBucket = byKey.get(transaction.recoveredAt.slice(0, 10));
      if (recoveredBucket) recoveredBucket.recovered += Math.round((transaction.amount / 100) * 100) / 100;
    }
  }

  return buckets.map(({ day, recovered, failed }) => ({ day, recovered, failed }));
}
