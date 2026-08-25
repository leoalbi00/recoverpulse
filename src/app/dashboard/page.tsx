import { AlertTriangle, DollarSign, TrendingUp, XCircle } from "lucide-react";

import { auth } from "@/auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecoveryChart } from "@/components/dashboard/recovery-chart";
import { FailedTransactionsTable } from "@/components/dashboard/failed-transactions-table";
import { computeDashboardStats, computeRecoveryChartData, listTransactions } from "@/lib/transactions";

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Utente";
  const allTransactions = await listTransactions();
  const recentTransactions = allTransactions.slice(0, 5);
  const stats = computeDashboardStats(allTransactions);
  const chartData = computeRecoveryChartData(allTransactions);

  const recoveredAmountLabel = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: stats.currency.toUpperCase(),
  }).format(stats.recoveredAmount / 100);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Bentornato, {firstName}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Ecco lo stato del recupero abbonamenti questo mese.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Fatturato Recuperato"
          value={recoveredAmountLabel}
          delta={`${stats.recoveredCount} di ${stats.totalCount} fatture`}
          trend={stats.recoveredAmount > 0 ? "up" : "neutral"}
        />
        <StatCard
          icon={TrendingUp}
          label="Tasso di Recupero"
          value={`${stats.recoveryRate}%`}
          delta={stats.totalCount > 0 ? `${stats.recoveredCount}/${stats.totalCount} recuperate` : "Nessun dato"}
          trend={stats.recoveryRate >= 50 ? "up" : stats.totalCount > 0 ? "down" : "neutral"}
        />
        <StatCard
          icon={XCircle}
          label="Pagamenti Persi"
          value={String(stats.lostCount)}
          delta={stats.totalCount > 0 ? `${stats.lostCount}/${stats.totalCount} fatture` : "Nessun dato"}
          trend={stats.lostCount > 0 ? "down" : "neutral"}
        />
        <StatCard
          icon={AlertTriangle}
          label="Pagamenti Falliti Attivi"
          value={String(stats.activeFailedCount)}
          delta="In corso di recupero"
          trend={stats.activeFailedCount > 0 ? "down" : "neutral"}
        />
      </div>

      <section className="mt-10 scroll-mt-20">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                Fatturato Recuperato vs Pagamenti Falliti
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Ultime due settimane, aggiornato in tempo reale via webhook Stripe.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
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

      <section id="transazioni" className="mt-10 scroll-mt-20">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">
            Transazioni Fallite Recenti
          </h2>
          <a
            href="/dashboard/transazioni"
            className="text-sm font-medium text-emerald-500 hover:text-emerald-400"
          >
            Vedi tutte
          </a>
        </div>
        <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
          <FailedTransactionsTable transactions={recentTransactions} />
        </div>
      </section>
    </main>
  );
}
