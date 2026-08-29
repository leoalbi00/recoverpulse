"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FailedTransaction, TransactionStatus } from "@/lib/transactions";

const STATUS_LABEL: Record<TransactionStatus, string> = {
  in_corso: "In recupero",
  recuperato: "Recuperato",
  perso: "Fallito",
};

const STATUS_BADGE_CLASS: Record<TransactionStatus, string> = {
  in_corso:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/20",
  recuperato:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:ring-emerald-500/20",
  perso:
    "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-500 dark:ring-rose-500/20",
};

const STATUS_FILTERS: { value: TransactionStatus | "tutti"; label: string }[] = [
  { value: "tutti", label: "Tutti gli stati" },
  { value: "in_corso", label: STATUS_LABEL.in_corso },
  { value: "recuperato", label: STATUS_LABEL.recuperato },
  { value: "perso", label: STATUS_LABEL.perso },
];

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" }).format(new Date(iso));
}

type FailedTransactionsTableProps = {
  transactions: FailedTransaction[];
  interactive?: boolean;
};

export function FailedTransactionsTable({ transactions, interactive = false }: FailedTransactionsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "tutti">("tutti");

  const filtered = useMemo(() => {
    if (!interactive) return transactions;

    const query = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchesStatus = statusFilter === "tutti" || tx.status === statusFilter;
      const matchesQuery =
        query.length === 0 ||
        tx.customerName.toLowerCase().includes(query) ||
        tx.customerEmail.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [transactions, interactive, search, statusFilter]);

  return (
    <div>
      {interactive && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cerca per cliente o email…"
              className="h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 pl-9 pr-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as TransactionStatus | "tutti")}
            className="relative z-10 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 sm:w-48"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value} className="bg-white dark:bg-zinc-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          {transactions.length === 0
            ? "Nessuna transazione fallita registrata al momento."
            : "Nessuna transazione corrisponde ai filtri selezionati."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                <th className="px-3 pb-3 font-medium first:pl-0">Cliente</th>
                <th className="px-3 pb-3 font-medium">Importo</th>
                <th className="px-3 pb-3 font-medium">Motivo</th>
                <th className="px-3 pb-3 font-medium">Stato</th>
                <th className="px-3 pb-3 font-medium">Data</th>
                {interactive && <th className="px-3 pb-3 text-right font-medium last:pr-0">Azioni</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {filtered.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} interactive={interactive} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TransactionRow({
  transaction,
  interactive,
}: {
  transaction: FailedTransaction;
  interactive: boolean;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResend() {
    setState("sending");
    try {
      const response = await fetch(`/api/dashboard/transactions/${transaction.invoiceId}/resend`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("resend failed");
      setState("sent");
    } catch {
      setState("error");
    } finally {
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <tr className="transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/30">
      <td className="px-3 py-3 first:pl-0">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">{transaction.customerName}</p>
        <p className="text-xs text-zinc-500">{transaction.customerEmail}</p>
      </td>
      <td className="px-3 py-3 font-medium text-zinc-900 dark:text-zinc-100">{formatAmount(transaction.amount, transaction.currency)}</td>
      <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">{transaction.reason}</td>
      <td className="px-3 py-3">
        <Badge className={STATUS_BADGE_CLASS[transaction.status]}>{STATUS_LABEL[transaction.status]}</Badge>
      </td>
      <td className="px-3 py-3 text-zinc-500">{formatDate(transaction.createdAt)}</td>
      {interactive && (
        <td className="px-3 py-3 text-right last:pr-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={transaction.status === "recuperato" || state === "sending"}
            onClick={handleResend}
          >
            {state === "sending" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            {state === "sent" ? "Sollecito inviato" : state === "error" ? "Invio non riuscito" : "Invia Sollecito Manuale"}
          </Button>
        </td>
      )}
    </tr>
  );
}
