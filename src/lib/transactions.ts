import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrCreatePaymentLinkToken } from "@/lib/payment-links";

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

const DEMO_TRANSACTIONS: Array<{
  customerName: string;
  customerEmail: string;
  planName: string;
  amount: number;
  reason: string;
  status: TransactionStatus;
  daysAgo: number;
  recoveredDaysAgo?: number;
}> = [
  {
    customerName: "Nova Studio SRL",
    customerEmail: "billing@novastudio.it",
    planName: "Growth",
    amount: 8900,
    reason: "Carta scaduta",
    status: "recuperato",
    daysAgo: 6,
    recoveredDaysAgo: 5,
  },
  {
    customerName: "Blue Ocean Agency",
    customerEmail: "finance@blueocean.co",
    planName: "Scale",
    amount: 19900,
    reason: "Fondi insufficienti",
    status: "in_corso",
    daysAgo: 1,
  },
  {
    customerName: "Marco Rossi Consulting",
    customerEmail: "marco@rossiconsulting.it",
    planName: "Starter",
    amount: 3900,
    reason: "Carta rifiutata dall'istituto emittente",
    status: "in_corso",
    daysAgo: 0,
  },
  {
    customerName: "Fenice Digital",
    customerEmail: "admin@fenicedigital.com",
    planName: "Growth",
    amount: 8900,
    reason: "Carta scaduta",
    status: "perso",
    daysAgo: 9,
  },
  {
    customerName: "Orion Labs",
    customerEmail: "ops@orionlabs.dev",
    planName: "Starter",
    amount: 3900,
    reason: "Fondi insufficienti",
    status: "recuperato",
    daysAgo: 3,
    recoveredDaysAgo: 2,
  },
  {
    customerName: "TechFlow Solutions",
    customerEmail: "billing@techflow.io",
    planName: "Scale",
    amount: 19900,
    reason: "Carta scaduta",
    status: "recuperato",
    daysAgo: 8,
    recoveredDaysAgo: 7,
  },
  {
    customerName: "Vertex Media",
    customerEmail: "accounts@vertexmedia.co",
    planName: "Growth",
    amount: 8900,
    reason: "Fondi insufficienti",
    status: "in_corso",
    daysAgo: 2,
  },
  {
    customerName: "Luna Print SRL",
    customerEmail: "amministrazione@lunaprint.it",
    planName: "Starter",
    amount: 3900,
    reason: "Carta rifiutata dall'istituto emittente",
    status: "perso",
    daysAgo: 12,
  },
];

/**
 * Popola la tabella con 8 transazioni simulate realistiche (nomi, importi
 * e stati di recupero diversi), utili per esplorare tabella e grafici in sviluppo
 * senza dover collegare un account Stripe con dati reali. Disabilitato in
 * produzione (vedi src/app/api/dashboard/demo-data/route.ts).
 */
export async function seedDemoTransactions(): Promise<FailedTransaction[]> {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const runId = now.toString(36);

  const rows = DEMO_TRANSACTIONS.map((item, index) => {
    const invoiceId = `demo_${runId}_${index}`;
    const createdAt = new Date(now - item.daysAgo * dayMs).toISOString();
    const recoveredAt =
      item.status === "recuperato"
        ? new Date(now - (item.recoveredDaysAgo ?? item.daysAgo) * dayMs).toISOString()
        : null;

    return {
      invoice_id: invoiceId,
      customer_id: `cus_demo_${runId}_${index}`,
      customer_name: item.customerName,
      customer_email: item.customerEmail,
      subscription_id: null,
      plan_name: item.planName,
      amount: item.amount,
      currency: "usd",
      reason: item.reason,
      status: item.status,
      payment_link_token: getOrCreatePaymentLinkToken(invoiceId),
      created_at: createdAt,
      recovered_at: recoveredAt,
    };
  });

  const { data, error } = await supabaseAdmin.from("failed_transactions").insert(rows).select();

  if (error) {
    throw new Error(`Errore nella creazione dei dati demo su Supabase: ${error.message}`);
  }

  return (data ?? []).map(mapRow);
}
