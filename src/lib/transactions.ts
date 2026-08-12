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

declare global {
  var __recoverpulseTransactions: Map<string, FailedTransaction> | undefined;
}

// In-memory demo store — sopravvive ai reload del dev server grazie a `globalThis`,
// ma va sostituito con un database vero (es. Prisma + Postgres) prima della produzione.
const transactions = globalThis.__recoverpulseTransactions ?? new Map<string, FailedTransaction>();
if (process.env.NODE_ENV !== "production") {
  globalThis.__recoverpulseTransactions = transactions;
}

export function recordFailedPayment(input: {
  invoiceId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subscriptionId: string | null;
  planName: string;
  amount: number;
  currency: string;
  reason: string;
}): FailedTransaction {
  const existing = transactions.get(input.invoiceId);

  const transaction: FailedTransaction = {
    id: existing?.id ?? crypto.randomUUID(),
    invoiceId: input.invoiceId,
    customerId: input.customerId,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    subscriptionId: input.subscriptionId,
    planName: input.planName,
    amount: input.amount,
    currency: input.currency,
    reason: input.reason,
    status: "in_corso",
    paymentLinkToken: existing?.paymentLinkToken ?? getOrCreatePaymentLinkToken(input.invoiceId),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    recoveredAt: null,
  };

  transactions.set(input.invoiceId, transaction);
  return transaction;
}

export function markInvoiceRecovered(invoiceId: string): FailedTransaction | null {
  const transaction = transactions.get(invoiceId);
  if (!transaction) return null;

  const updated: FailedTransaction = {
    ...transaction,
    status: "recuperato",
    recoveredAt: new Date().toISOString(),
  };

  transactions.set(invoiceId, updated);
  return updated;
}

export function getTransaction(invoiceId: string) {
  return transactions.get(invoiceId) ?? null;
}

export function listTransactions() {
  return Array.from(transactions.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
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

export function getDashboardStats(): DashboardStats {
  const all = listTransactions();
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

export function getRecoveryChartData(days = 14): RecoveryChartPoint[] {
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

  for (const transaction of listTransactions()) {
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
 * Popola lo store demo con 8 transazioni simulate realistiche (nomi, importi
 * e stati di recupero diversi), utili per esplorare tabella e grafici in sviluppo
 * senza dover collegare un account Stripe con dati reali.
 */
export function seedDemoTransactions(): FailedTransaction[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const runId = now.toString(36);

  return DEMO_TRANSACTIONS.map((item, index) => {
    const invoiceId = `demo_${runId}_${index}`;
    const createdAt = new Date(now - item.daysAgo * dayMs).toISOString();
    const recoveredAt =
      item.status === "recuperato"
        ? new Date(now - (item.recoveredDaysAgo ?? item.daysAgo) * dayMs).toISOString()
        : null;

    const transaction: FailedTransaction = {
      id: crypto.randomUUID(),
      invoiceId,
      customerId: `cus_demo_${runId}_${index}`,
      customerName: item.customerName,
      customerEmail: item.customerEmail,
      subscriptionId: null,
      planName: item.planName,
      amount: item.amount,
      currency: "usd",
      reason: item.reason,
      status: item.status,
      paymentLinkToken: getOrCreatePaymentLinkToken(invoiceId),
      createdAt,
      recoveredAt,
    };

    transactions.set(invoiceId, transaction);
    return transaction;
  });
}
