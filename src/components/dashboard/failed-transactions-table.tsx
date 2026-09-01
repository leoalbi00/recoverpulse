"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { FailedTransaction, TransactionStatus } from "@/lib/transactions";
import {
  TIME_RANGE_OPTIONS,
  filterTransactionsByRange,
  type TimeRange,
} from "@/lib/dashboard-analytics";

const STATUS_LABEL: Record<TransactionStatus, string> = {
  in_corso: "In recupero",
  recuperato: "Recuperato",
  perso: "Fallito",
};

const STATUS_BADGE_CLASS: Record<TransactionStatus, string> = {
  in_corso: "bg-amber-100 text-amber-800",
  recuperato: "bg-emerald-100 text-emerald-800",
  perso: "bg-rose-100 text-rose-800",
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
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

type FailedTransactionsTableProps = {
  transactions: FailedTransaction[];
  /** Dominio di produzione per costruire il link assoluto del portale /pay (src/lib/app-url.ts). */
  appBaseUrl: string;
};

export function FailedTransactionsTable({ transactions, appBaseUrl }: FailedTransactionsTableProps) {
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "tutti">("tutti");
  const [range, setRange] = useState<TimeRange>("all");

  const filtered = useMemo(() => {
    const byRange = filterTransactionsByRange(transactions, range);
    if (statusFilter === "tutti") return byRange;
    return byRange.filter((tx) => tx.status === statusFilter);
  }, [transactions, statusFilter, range]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as TransactionStatus | "tutti")}
          className="h-9 rounded-lg border border-zinc-200/80 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 sm:w-48"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value} className="bg-white text-zinc-900">
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={range}
          onChange={(event) => setRange(event.target.value as TimeRange)}
          className="h-9 rounded-lg border border-zinc-200/80 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 sm:w-48"
        >
          {TIME_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-white text-zinc-900">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-600">
          {transactions.length === 0
            ? "Nessuna transazione fallita registrata al momento."
            : "Nessuna transazione corrisponde ai filtri selezionati."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 text-xs uppercase tracking-wide text-zinc-600">
                <th className="px-3 pb-3 font-medium first:pl-0">Cliente</th>
                <th className="px-3 pb-3 font-medium">Importo</th>
                <th className="px-3 pb-3 font-medium">Stato</th>
                <th className="px-3 pb-3 font-medium">Data Notifica</th>
                <th className="px-3 pb-3 font-medium last:pr-0">Link /pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filtered.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} appBaseUrl={appBaseUrl} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TransactionRow({ transaction, appBaseUrl }: { transaction: FailedTransaction; appBaseUrl: string }) {
  const [copied, setCopied] = useState(false);
  const payLink = `${appBaseUrl}/pay/${transaction.paymentLinkToken}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(payLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <tr className="transition-colors hover:bg-zinc-100">
      <td className="px-3 py-3 first:pl-0">
        <p className="font-medium text-zinc-900">{transaction.customerName}</p>
        <p className="text-xs text-zinc-600">{transaction.customerEmail}</p>
      </td>
      <td className="px-3 py-3 font-medium text-zinc-900">
        {formatAmount(transaction.amount, transaction.currency)}
      </td>
      <td className="px-3 py-3">
        <Badge className={STATUS_BADGE_CLASS[transaction.status]}>{STATUS_LABEL[transaction.status]}</Badge>
      </td>
      <td className="px-3 py-3 text-zinc-600">
        {transaction.firstNoticeSentAt ? formatDate(transaction.firstNoticeSentAt) : "—"}
      </td>
      <td className="px-3 py-3 last:pr-0">
        <div className="flex items-center gap-2">
          <a
            href={payLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-500"
          >
            <ExternalLink className="size-3.5" />
            Apri
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-800"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            {copied ? "Copiato" : "Copia"}
          </button>
        </div>
      </td>
    </tr>
  );
}
