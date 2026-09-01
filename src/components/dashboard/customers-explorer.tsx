"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CustomerProfile } from "@/lib/dashboard-analytics";
import type { TransactionStatus } from "@/lib/transactions";

const STATUS_LABEL: Record<TransactionStatus, string> = {
  in_corso: "In recupero",
  recuperato: "Recuperato",
  perso: "Fallita",
};

const STATUS_BADGE_CLASS: Record<TransactionStatus, string> = {
  in_corso: "bg-amber-100 text-amber-800",
  recuperato: "bg-emerald-100 text-emerald-800",
  perso: "bg-rose-100 text-rose-800",
};

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
    year: "numeric",
  }).format(new Date(iso));
}

export function CustomersExplorer({ customers }: { customers: CustomerProfile[] }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (customer) =>
        customer.customerName.toLowerCase().includes(query) ||
        customer.customerEmail.toLowerCase().includes(query),
    );
  }, [customers, search]);

  const selected = customers.find((customer) => customer.customerId === selectedId) ?? null;

  return (
    <div>
      <div className="relative mb-5 max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-600" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca per cliente o email…"
          className="h-9 w-full rounded-lg border border-zinc-200/80 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-600">
          {customers.length === 0
            ? "Nessun cliente con fatture registrate al momento."
            : "Nessun cliente corrisponde alla ricerca."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200/80 text-xs uppercase tracking-wide text-zinc-600">
                <th className="px-3 pb-3 font-medium first:pl-0">Cliente</th>
                <th className="px-3 pb-3 font-medium">Totale Fatturato</th>
                <th className="px-3 pb-3 font-medium">Incassato / Recuperato</th>
                <th className="px-3 pb-3 font-medium">Fatture Totali</th>
                <th className="px-3 pb-3 text-right font-medium last:pr-0">Fatture Fallite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filtered.map((customer) => (
                <tr
                  key={customer.customerId}
                  onClick={() => setSelectedId(customer.customerId)}
                  className="cursor-pointer transition-colors hover:bg-zinc-100"
                >
                  <td className="px-3 py-3 first:pl-0">
                    <p className="font-medium text-zinc-900">{customer.customerName}</p>
                    <p className="text-xs text-zinc-600">{customer.customerEmail}</p>
                  </td>
                  <td className="px-3 py-3 font-medium text-zinc-900">
                    {formatAmount(customer.totalInvoicedAmount, customer.currency)}
                  </td>
                  <td className="px-3 py-3 text-emerald-700">
                    {formatAmount(customer.totalRecoveredAmount, customer.currency)}
                  </td>
                  <td className="px-3 py-3 text-zinc-600">{customer.totalInvoiceCount}</td>
                  <td className="px-3 py-3 text-right text-zinc-600 last:pr-0">
                    {customer.failedInvoiceCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <CustomerDetailDrawer customer={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function CustomerDetailDrawer({
  customer,
  onClose,
}: {
  customer: CustomerProfile;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-hidden border-l border-zinc-200/80 bg-white text-zinc-900 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200/80 p-5">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-zinc-900">{customer.customerName}</p>
            <p className="truncate text-xs text-zinc-600">{customer.customerEmail}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
            aria-label="Chiudi"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-zinc-200/80 p-5 text-sm">
          <div>
            <p className="text-xs text-zinc-600">Totale Fatturato</p>
            <p className="mt-0.5 font-semibold text-zinc-900">
              {formatAmount(customer.totalInvoicedAmount, customer.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-600">Incassato / Recuperato</p>
            <p className="mt-0.5 font-semibold text-emerald-700">
              {formatAmount(customer.totalRecoveredAmount, customer.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-600">Fatture Totali</p>
            <p className="mt-0.5 font-semibold text-zinc-900">{customer.totalInvoiceCount}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-600">Fatture Fallite</p>
            <p className="mt-0.5 font-semibold text-zinc-900">{customer.failedInvoiceCount}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Tutte le fatture
          </p>
          <ul className="flex flex-col gap-3">
            {customer.transactions.map((transaction) => (
              <li key={transaction.id} className="rounded-lg border border-zinc-200/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-zinc-900">
                    {formatAmount(transaction.amount, transaction.currency)}
                  </p>
                  <Badge className={STATUS_BADGE_CLASS[transaction.status]}>
                    {STATUS_LABEL[transaction.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  {transaction.planName} · fallita il {formatDate(transaction.createdAt)}
                </p>
                {transaction.recoveredAt && (
                  <p className="mt-0.5 text-xs text-emerald-700">
                    Recuperata il {formatDate(transaction.recoveredAt)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
