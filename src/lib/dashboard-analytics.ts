// Funzioni pure di calcolo per la dashboard (KPI, grafico, performance
// sequenze): nessuna dipendenza da Supabase o da altro codice server-only,
// così sono richiamabili sia da Server Component (src/app/dashboard/page.tsx)
// sia dal componente client che gestisce il filtro temporale interattivo
// (src/components/dashboard/dashboard-overview.tsx).

import type { FailedTransaction } from "@/lib/transactions";

const DAY_MS = 24 * 60 * 60 * 1000;

export type TimeRange = "7d" | "30d" | "month" | "all";

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "Ultimi 7 gg" },
  { value: "30d", label: "Ultimi 30 gg" },
  { value: "month", label: "Questo mese" },
  { value: "all", label: "Tutto" },
];

/**
 * Filtra le transazioni in base alla data di fallimento (`createdAt`): le
 * metriche restano un'analisi per coorte ("delle fatture fallite in questo
 * periodo, quante si sono poi recuperate"), coerente con
 * computeDashboardStats più sotto, indipendentemente da quando il recupero è
 * poi avvenuto.
 */
export function filterTransactionsByRange(
  transactions: FailedTransaction[],
  range: TimeRange,
  now: Date = new Date()
): FailedTransaction[] {
  if (range === "all") return transactions;

  let startTime: number;
  if (range === "7d") {
    startTime = now.getTime() - 7 * DAY_MS;
  } else if (range === "30d") {
    startTime = now.getTime() - 30 * DAY_MS;
  } else {
    startTime = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
  }

  return transactions.filter((transaction) => new Date(transaction.createdAt).getTime() >= startTime);
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

export type MrrRecoveredStats = {
  /** Somma di tutti i pagamenti recuperati, indipendentemente da quando. */
  totalAmount: number;
  /** Solo i recuperi avvenuti nel mese solare corrente (recoveredAt). */
  monthAmount: number;
  currency: string;
};

/**
 * MRR Recuperato: calcolato sempre su tutte le transazioni (non sul periodo
 * selezionato in dashboard), perché è un KPI di sintesi "quanto abbiamo
 * recuperato in totale / questo mese", non un'analisi per coorte come
 * computeDashboardStats.
 */
export function computeMrrRecovered(all: FailedTransaction[], now: Date = new Date()): MrrRecoveredStats {
  const recovered = all.filter((t) => t.status === "recuperato");
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();

  const totalAmount = recovered.reduce((sum, t) => sum + t.amount, 0);
  const monthAmount = recovered
    .filter((t) => t.recoveredAt && new Date(t.recoveredAt).getTime() >= monthStart)
    .reduce((sum, t) => sum + t.amount, 0);

  return { totalAmount, monthAmount, currency: all[0]?.currency ?? "usd" };
}

export type VolumeAtRiskStats = {
  /** Somma degli importi delle fatture ancora "in_corso" (non recuperate né perse). */
  amount: number;
  count: number;
  currency: string;
};

/** Volume a Rischio: fotografia dello stato attuale, non scoperta a un periodo storico. */
export function computeVolumeAtRisk(all: FailedTransaction[]): VolumeAtRiskStats {
  const active = all.filter((t) => t.status === "in_corso");
  return {
    amount: active.reduce((sum, t) => sum + t.amount, 0),
    count: active.length,
    currency: all[0]?.currency ?? "usd",
  };
}

export type RecoveryChartPoint = {
  day: string;
  recovered: number;
  failed: number;
};

/**
 * Andamento mensile (recuperi vs fallimenti) per il grafico principale della
 * dashboard: bucket per mese solare invece che per giorno, sempre su tutte le
 * transazioni (non sul periodo selezionato altrove in dashboard) — è la vista
 * "trend" di lungo periodo, complementare alle card KPI.
 */
export function computeMonthlyRecoveryChartData(
  all: FailedTransaction[],
  monthsCount = 6,
  now: Date = new Date()
): RecoveryChartPoint[] {
  const buckets = Array.from({ length: monthsCount }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      day: new Intl.DateTimeFormat("it-IT", { month: "short", year: "numeric" }).format(date),
      recovered: 0,
      failed: 0,
    };
  });

  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  const monthKey = (iso: string) => iso.slice(0, 7);

  for (const transaction of all) {
    const failedBucket = byKey.get(monthKey(transaction.createdAt));
    if (failedBucket) failedBucket.failed += Math.round((transaction.amount / 100) * 100) / 100;

    if (transaction.status === "recuperato" && transaction.recoveredAt) {
      const recoveredBucket = byKey.get(monthKey(transaction.recoveredAt));
      if (recoveredBucket) recoveredBucket.recovered += Math.round((transaction.amount / 100) * 100) / 100;
    }
  }

  return buckets.map(({ day, recovered, failed }) => ({ day, recovered, failed }));
}

/** Riga grezza di dunning_logs, ridotta ai soli campi usati dall'analisi per step. */
export type DunningLogEntry = {
  invoiceId: string;
  stepDays: number;
  status: "sent" | "failed";
};

export type SequenceStepDefinition = {
  id: string;
  label: string;
  /** Giorni di attesa dopo il pagamento fallito. 0 per il sollecito immediato. */
  delayDays: number;
};

export type SequenceStepPerformance = SequenceStepDefinition & {
  /** Fatture che hanno raggiunto questo step (per "immediate", tutte le fatture fallite del periodo). */
  reached: number;
  /** Tra quelle raggiunte, quante sono oggi in stato "recuperato" (non necessariamente convertite proprio a questo step). */
  recovered: number;
  /** Percentuale recovered/reached, arrotondata. */
  conversionRate: number;
};

/**
 * Tasso di conversione per step della sequenza dunning: per ogni step,
 * percentuale di fatture che lo hanno raggiunto e sono oggi "recuperato".
 * Lo step "immediate" (T+0) non viene mai registrato su dunning_logs (è
 * inviato subito dal webhook, non dal cron — vedi src/lib/dunning.ts), quindi
 * per quello si usa l'intero insieme delle fatture fallite come "raggiunte".
 * Per gli altri step si usano i soli invoice_id con un log di stato "sent"
 * per quel delayDays (src/lib/dunning-logs.ts).
 *
 * Nota: le percentuali per step successivi si sovrappongono (una fattura
 * recuperata dopo l'ultimo avviso conta come "recuperata" anche per gli step
 * precedenti che ha attraversato) — è una lettura "efficacia complessiva fino
 * a qui", non un funnel a esclusione reciproca.
 */
export function computeSequencePerformance(
  transactions: FailedTransaction[],
  dunningLogs: DunningLogEntry[],
  steps: SequenceStepDefinition[]
): SequenceStepPerformance[] {
  const transactionById = new Map(transactions.map((t) => [t.invoiceId, t]));

  const sentStepsByInvoice = new Map<string, Set<number>>();
  for (const log of dunningLogs) {
    if (log.status !== "sent") continue;
    if (!transactionById.has(log.invoiceId)) continue;
    const sentSteps = sentStepsByInvoice.get(log.invoiceId) ?? new Set<number>();
    sentSteps.add(log.stepDays);
    sentStepsByInvoice.set(log.invoiceId, sentSteps);
  }

  return [...steps]
    .sort((a, b) => a.delayDays - b.delayDays)
    .map((step) => {
      const reachedIds =
        step.delayDays === 0
          ? transactions.map((t) => t.invoiceId)
          : transactions
              .filter((t) => sentStepsByInvoice.get(t.invoiceId)?.has(step.delayDays))
              .map((t) => t.invoiceId);

      const recoveredCount = reachedIds.filter((id) => transactionById.get(id)?.status === "recuperato").length;

      return {
        ...step,
        reached: reachedIds.length,
        recovered: recoveredCount,
        conversionRate: reachedIds.length > 0 ? Math.round((recoveredCount / reachedIds.length) * 100) : 0,
      };
    });
}
