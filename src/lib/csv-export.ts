// Export CSV condiviso da TransactionsExplorer (/dashboard/recuperi) e dal
// nuovo pannello della dashboard principale: nessuna dipendenza da Supabase o
// da altro codice server-only, così è richiamabile da qualunque componente
// client ("use client").

import type { FailedTransaction, TransactionStatus } from "@/lib/transactions";

const STATUS_LABEL: Record<TransactionStatus, string> = {
  in_corso: "In corso",
  recuperato: "Recuperato",
  perso: "Perso",
};

export function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export type DunningAttemptSummary = {
  attempts: number;
};

/**
 * Costruisce il CSV delle transazioni. Se `dunningByInvoice` è passato,
 * aggiunge la colonna "Tentativi Dunning" (usata da TransactionsExplorer);
 * altrimenti la omette, per un export più snello dove quel dato non è
 * disponibile (es. il pannello della dashboard principale).
 */
export function transactionsToCsv(
  transactions: FailedTransaction[],
  dunningByInvoice?: Record<string, DunningAttemptSummary>
): string {
  const header = [
    "ID Fattura",
    "Cliente",
    "Email",
    "Importo",
    "Valuta",
    "Data Fallimento",
    "Stato",
    "Data Recupero",
    ...(dunningByInvoice ? ["Tentativi Dunning"] : []),
  ];

  const rows = transactions.map((tx) => {
    const fields = [
      tx.invoiceId,
      tx.customerName,
      tx.customerEmail,
      (tx.amount / 100).toFixed(2),
      tx.currency.toUpperCase(),
      tx.createdAt.slice(0, 10),
      STATUS_LABEL[tx.status],
      tx.recoveredAt ? tx.recoveredAt.slice(0, 10) : "",
      ...(dunningByInvoice ? [String(dunningByInvoice[tx.invoiceId]?.attempts ?? 0)] : []),
    ];
    return fields.map((field) => csvEscape(String(field))).join(";");
  });

  // BOM iniziale: senza, Excel apre il CSV UTF-8 interpretando male gli accenti.
  return "﻿" + [header.join(";"), ...rows].join("\n");
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
