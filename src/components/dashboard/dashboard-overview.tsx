"use client";

import { useMemo } from "react";
import { AlertTriangle, DollarSign, TrendingUp, Wallet } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { RecoveryChart } from "@/components/dashboard/recovery-chart";
import { PaywallUnlockCard } from "@/components/dashboard/paywall-unlock-card";
import { cn } from "@/lib/utils";
import type { FailedTransaction } from "@/lib/transactions";
import type { PaywallStatus } from "@/lib/paywall";
import {
  computeDashboardStats,
  computeMonthlyRecoveryChartData,
  computeMrrRecovered,
  computeTotalRevenue,
  computeVolumeAtRisk,
  computeSequencePerformance,
  type DunningLogEntry,
  type SequenceStepDefinition,
} from "@/lib/dashboard-analytics";

type DashboardOverviewProps = {
  allTransactions: FailedTransaction[];
  dunningLogs: DunningLogEntry[];
  sequenceSteps: SequenceStepDefinition[];
  paywall: PaywallStatus;
};

function conversionColorClass(reached: number, rate: number): string {
  if (reached === 0) return "text-zinc-400";
  if (rate >= 50) return "text-emerald-600";
  if (rate >= 20) return "text-amber-600";
  return "text-rose-600";
}

export function DashboardOverview({
  allTransactions,
  dunningLogs,
  sequenceSteps,
  paywall,
}: DashboardOverviewProps) {
  // Le card KPI e il grafico mensile sono sempre calcolati su tutto lo
  // storico (non su un periodo selezionabile): sono numeri di sintesi
  // "quanto abbiamo recuperato in totale / questo mese / a rischio ora", non
  // un'analisi per coorte. Il filtro per periodo vive solo in /dashboard/recuperi
  // (src/components/dashboard/transactions-explorer.tsx), dove ha senso
  // restringere la vista storica.
  const stats = useMemo(() => computeDashboardStats(allTransactions), [allTransactions]);
  const totalRevenue = useMemo(() => computeTotalRevenue(allTransactions), [allTransactions]);
  const mrr = useMemo(() => computeMrrRecovered(allTransactions), [allTransactions]);
  const volumeAtRisk = useMemo(() => computeVolumeAtRisk(allTransactions), [allTransactions]);
  const chartData = useMemo(() => computeMonthlyRecoveryChartData(allTransactions, 6), [allTransactions]);
  const sequencePerformance = useMemo(
    () => computeSequencePerformance(allTransactions, dunningLogs, sequenceSteps),
    [allTransactions, dunningLogs, sequenceSteps]
  );

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Totale Fatturato"
          value={formatCurrency(totalRevenue.amount, totalRevenue.currency)}
          delta={totalRevenue.count > 0 ? `${totalRevenue.count} fatture totali` : "Nessun dato"}
          trend={totalRevenue.amount > 0 ? "up" : "neutral"}
        />
        <StatCard
          icon={DollarSign}
          label="MRR Recuperato"
          value={formatCurrency(mrr.totalAmount, mrr.currency)}
          delta={`${formatCurrency(mrr.monthAmount, mrr.currency)} questo mese`}
          trend={mrr.totalAmount > 0 ? "up" : "neutral"}
        />
        <StatCard
          icon={TrendingUp}
          label="Tasso di Recupero"
          value={`${stats.recoveryRate}%`}
          delta={stats.totalCount > 0 ? `${stats.recoveredCount}/${stats.totalCount} recuperate` : "Nessun dato"}
          trend={stats.recoveryRate >= 50 ? "up" : stats.totalCount > 0 ? "down" : "neutral"}
        />
        <StatCard
          icon={AlertTriangle}
          label="Volume a Rischio"
          value={formatCurrency(volumeAtRisk.amount, volumeAtRisk.currency)}
          delta={`${volumeAtRisk.count} fatture in corso di recupero`}
          trend={volumeAtRisk.amount > 0 ? "down" : "neutral"}
        />
      </div>

      {paywall.locked ? (
        <PaywallUnlockCard trial={paywall.trial} />
      ) : (
        <>
          <section className="mt-10 scroll-mt-20">
            <div className="rounded-xl border border-zinc-200/80 bg-white text-zinc-900 p-6 shadow-md sm:p-8">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Andamento Mensile</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    Ultimi 6 mesi, aggiornato in tempo reale via webhook Stripe.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Fatturato Recuperato
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-500" />
                    Pagamenti Falliti
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <RecoveryChart data={chartData} />
              </div>
            </div>
          </section>

          <section className="mt-10 scroll-mt-20">
            <div className="rounded-xl border border-zinc-200/80 bg-white text-zinc-900 p-6 shadow-md sm:p-8">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Performance Sequenze</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Tasso di conversione per step della sequenza dunning (dall&apos;inizio).
                </p>
              </div>

              {sequencePerformance.length === 0 ? (
                <p className="mt-6 py-4 text-center text-sm text-zinc-600">
                  Nessuno step di dunning configurato in /dashboard/dunning.
                </p>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200/80 text-xs uppercase tracking-wide text-zinc-600">
                        <th className="px-3 pb-3 font-medium first:pl-0">Step</th>
                        <th className="px-3 pb-3 font-medium">Ritardo</th>
                        <th className="px-3 pb-3 font-medium">Fatture Raggiunte</th>
                        <th className="px-3 pb-3 font-medium">Recuperate</th>
                        <th className="px-3 pb-3 text-right font-medium last:pr-0">Tasso di Conversione</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {sequencePerformance.map((step) => (
                        <tr key={step.id} className="transition-colors hover:bg-zinc-100">
                          <td className="px-3 py-3 font-medium text-zinc-900 first:pl-0">{step.label}</td>
                          <td className="px-3 py-3 text-zinc-600">
                            {step.delayDays === 0 ? "Immediato" : `T+${step.delayDays} giorni`}
                          </td>
                          <td className="px-3 py-3 text-zinc-600">{step.reached}</td>
                          <td className="px-3 py-3 text-zinc-600">{step.recovered}</td>
                          <td
                            className={cn(
                              "px-3 py-3 text-right font-semibold last:pr-0",
                              conversionColorClass(step.reached, step.conversionRate)
                            )}
                          >
                            {step.reached > 0 ? `${step.conversionRate}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
