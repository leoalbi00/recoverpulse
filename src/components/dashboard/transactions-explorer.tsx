"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, Search, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FailedTransaction, TransactionStatus } from "@/lib/transactions";
import type { DunningLogChannel } from "@/lib/dunning-logs";

const STATUS_LABEL: Record<TransactionStatus, string> = {
  in_corso: "In corso",
  recuperato: "Recuperato",
  perso: "Perso",
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
  { value: "tutti", label: "Tutti" },
  { value: "recuperato", label: STATUS_LABEL.recuperato },
  { value: "in_corso", label: STATUS_LABEL.in_corso },
  { value: "perso", label: STATUS_LABEL.perso },
];

const CHANNEL_LABEL: Record<DunningLogChannel, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
};

export type DunningAttemptInfo = {
  attempts: number;
  lastChannel: DunningLogChannel;
  lastStatus: "sent" | "failed";
  lastSentAt: string;
};

const PAGE_SIZE = 10;

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso)
  );
}

function lastActionLabel(transaction: FailedTransaction, dunning: DunningAttemptInfo | undefined): string {
  if (transaction.status === "recuperato" && transaction.recoveredAt) {
    return `Pagamento recuperato il ${formatDate(transaction.recoveredAt)}`;
  }
  if (transaction.status === "perso") {
    return "Recupero abbandonato";
  }
  if (!dunning) {
    return "Nessun sollecito inviato";
  }
  const channelLabel = CHANNEL_LABEL[dunning.lastChannel];
  const outcome = dunning.lastStatus === "sent" ? "inviato" : "non riuscito";
  return `Sollecito ${channelLabel} ${outcome} il ${formatDate(dunning.lastSentAt)}`;
}

function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadTransactionsCsv(
  transactions: FailedTransaction[],
  dunningByInvoice: Record<string, DunningAttemptInfo>
) {
  const header = [
    "ID Fattura",
    "Cliente",
    "Email",
    "Importo",
    "Valuta",
    "Data Fallimento",
    "Stato",
    "Tentativi Dunning",
    "Ultima Azione",
  ];

  const rows = transactions.map((tx) => {
    const dunning = dunningByInvoice[tx.invoiceId];
    return [
      tx.invoiceId,
      tx.customerName,
      tx.customerEmail,
      (tx.amount / 100).toFixed(2),
      tx.currency.toUpperCase(),
      tx.createdAt.slice(0, 10),
      STATUS_LABEL[tx.status],
      String(dunning?.attempts ?? 0),
      lastActionLabel(tx, dunning),
    ]
      .map((field) => csvEscape(String(field)))
      .join(";");
  });

  const csv = [header.join(";"), ...rows].join("\n");
  // BOM iniziale: senza, Excel apre il CSV UTF-8 interpretando male gli accenti.
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `transazioni-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

type TransactionsExplorerProps = {
  transactions: FailedTransaction[];
  dunningByInvoice: Record<string, DunningAttemptInfo>;
};

export function TransactionsExplorer({ transactions, dunningByInvoice }: TransactionsExplorerProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "tutti">("tutti");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchesStatus = statusFilter === "tutti" || tx.status === statusFilter;
      const matchesQuery =
        query.length === 0 ||
        tx.customerName.toLowerCase().includes(query) ||
        tx.customerEmail.toLowerCase().includes(query) ||
        tx.invoiceId.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [transactions, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const paginated = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  function updateStatusFilter(value: TransactionStatus | "tutti") {
    setStatusFilter(value);
    setPage(0);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Cerca per cliente, email o ID fattura…"
              className="h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 pl-9 pr-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => updateStatusFilter(event.target.value as TransactionStatus | "tutti")}
            className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 sm:w-44"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value} className="bg-white dark:bg-zinc-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={filtered.length === 0}
          onClick={() => downloadTransactionsCsv(filtered, dunningByInvoice)}
        >
          <Download className="size-3.5" />
          Esporta CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">
          {transactions.length === 0
            ? "Nessuna transazione registrata al momento."
            : "Nessuna transazione corrisponde ai filtri selezionati."}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                  <th className="px-3 pb-3 font-medium first:pl-0">Cliente</th>
                  <th className="px-3 pb-3 font-medium">Importo</th>
                  <th className="px-3 pb-3 font-medium">Data Fallimento</th>
                  <th className="px-3 pb-3 font-medium">Stato</th>
                  <th className="px-3 pb-3 font-medium">Tentativi Dunning</th>
                  <th className="px-3 pb-3 font-medium">Ultima Azione</th>
                  <th className="px-3 pb-3 text-right font-medium last:pr-0">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                {paginated.map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} dunning={dunningByInvoice[tx.invoiceId]} />
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="mt-5 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                Pagina {currentPage + 1} di {pageCount} · {filtered.length} transazioni
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TransactionRow({
  transaction,
  dunning,
}: {
  transaction: FailedTransaction;
  dunning: DunningAttemptInfo | undefined;
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
      <td className="px-3 py-3 font-medium text-zinc-900 dark:text-zinc-100">
        {formatAmount(transaction.amount, transaction.currency)}
      </td>
      <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">{formatDate(transaction.createdAt)}</td>
      <td className="px-3 py-3">
        <Badge className={STATUS_BADGE_CLASS[transaction.status]}>{STATUS_LABEL[transaction.status]}</Badge>
      </td>
      <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">{dunning?.attempts ?? 0}</td>
      <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">{lastActionLabel(transaction, dunning)}</td>
      <td className="px-3 py-3 text-right last:pr-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={transaction.status !== "in_corso" || state === "sending"}
          onClick={handleResend}
        >
          {state === "sending" ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          {state === "sent" ? "Inviato" : state === "error" ? "Errore" : "Sollecito"}
        </Button>
      </td>
    </tr>
  );
}
