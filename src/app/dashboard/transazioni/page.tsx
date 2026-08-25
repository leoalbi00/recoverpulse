import { FailedTransactionsTable } from "@/components/dashboard/failed-transactions-table";
import { listTransactions } from "@/lib/transactions";

export default async function TransazioniPage() {
  const transactions = await listTransactions();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Transazioni
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Pagamenti falliti intercettati via webhook Stripe.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
        <FailedTransactionsTable transactions={transactions} interactive />
      </div>
    </main>
  );
}
