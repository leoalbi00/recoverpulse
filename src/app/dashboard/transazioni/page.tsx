import {
  TransactionsExplorer,
  type DunningAttemptInfo,
} from "@/components/dashboard/transactions-explorer";
import { getDunningLogSummaries } from "@/lib/dunning-logs";
import { listTransactions, type FailedTransaction } from "@/lib/transactions";

/**
 * Carica transazioni e riepilogo solleciti da Supabase con un fallback pulito
 * a liste vuote: se il DB non è raggiungibile o non ancora configurato (es.
 * ambiente locale senza .env completo), la pagina mostra lo stato vuoto della
 * tabella invece di rompere il render del Server Component.
 */
async function loadTransactionsData(): Promise<{
  transactions: FailedTransaction[];
  dunningByInvoice: Record<string, DunningAttemptInfo>;
}> {
  let transactions: FailedTransaction[] = [];
  try {
    transactions = await listTransactions();
  } catch (error) {
    console.error(
      "[dashboard/transazioni] errore nel recupero delle transazioni:",
      error,
    );
    return { transactions: [], dunningByInvoice: {} };
  }

  let dunningByInvoice: Record<string, DunningAttemptInfo> = {};
  try {
    const summaries = await getDunningLogSummaries(
      transactions.map((tx) => tx.invoiceId),
    );
    dunningByInvoice = Object.fromEntries(summaries);
  } catch (error) {
    console.error(
      "[dashboard/transazioni] errore nel recupero dello storico solleciti:",
      error,
    );
  }

  return { transactions, dunningByInvoice };
}

export default async function TransazioniPage() {
  const { transactions, dunningByInvoice } = await loadTransactionsData();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Transazioni
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Storico completo dei pagamenti falliti intercettati via webhook
          Stripe, con lo stato di recupero e i solleciti inviati per ciascuna
          fattura.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:shadow-md">
        <TransactionsExplorer
          transactions={transactions}
          dunningByInvoice={dunningByInvoice}
        />
      </div>
    </main>
  );
}
