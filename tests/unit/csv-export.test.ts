import { describe, expect, it } from "vitest";

import { csvEscape, transactionsToCsv } from "@/lib/csv-export";
import type { FailedTransaction } from "@/lib/transactions";

const BOM = "﻿";

function tx(overrides: Partial<FailedTransaction> = {}): FailedTransaction {
  return {
    id: "1",
    userId: "u1",
    invoiceId: "in_001",
    customerId: "cus_1",
    customerName: "Mario Rossi",
    customerEmail: "mario@example.com",
    subscriptionId: null,
    planName: "Pro",
    amount: 4900,
    currency: "eur",
    reason: "card_declined",
    status: "in_corso",
    paymentLinkToken: "tok",
    hostedInvoiceUrl: null,
    createdAt: "2026-10-01T10:00:00.000Z",
    recoveredAt: null,
    firstNoticeSentAt: null,
    ...overrides,
  } as FailedTransaction;
}

describe("csvEscape", () => {
  it("lascia invariati i valori semplici", () => {
    expect(csvEscape("Mario Rossi")).toBe("Mario Rossi");
    expect(csvEscape("")).toBe("");
  });

  it("quota i valori con separatori, virgolette o a capo", () => {
    expect(csvEscape("a;b")).toBe('"a;b"');
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('Acme "Srl"')).toBe('"Acme ""Srl"""');
    expect(csvEscape("riga1\nriga2")).toBe('"riga1\nriga2"');
  });

  // Un CR nudo in un campo (es. nome cliente incollato da Windows) spezzerebbe la riga.
  it("quota anche i valori con carriage return", () => {
    expect(csvEscape("riga1\rriga2")).toBe('"riga1\rriga2"');
  });

  // CSV/Formula injection (OWASP): un valore controllato dal cliente finale (nome, email da
  // Stripe) che inizia con = + - @ (o TAB / CR) non deve essere interpretato come formula.
  it.each(["=HYPERLINK(\"http://evil\",\"x\")", "+cmd|' /C calc'!A0", "-2+3", "@SUM(1+1)", "\t=1+1"])(
    "neutralizza le formule (%s)",
    (payload) => {
      const escaped = csvEscape(payload);
      expect(escaped.replace(/^"/, "")).not.toMatch(/^[=+\-@\t\r]/);
    }
  );
});

describe("transactionsToCsv", () => {
  it("genera BOM, intestazione e righe separate da ';'", () => {
    const csv = transactionsToCsv([tx(), tx({ invoiceId: "in_002", status: "recuperato", recoveredAt: "2026-10-05T08:00:00Z", amount: 12345, currency: "usd" })]);
    expect(csv.startsWith(BOM)).toBe(true);
    const lines = csv.slice(1).split("\n");
    expect(lines[0]).toBe("ID Fattura;Cliente;Email;Importo;Valuta;Data Fallimento;Stato;Data Recupero");
    expect(lines[1]).toBe("in_001;Mario Rossi;mario@example.com;49.00;EUR;2026-10-01;In corso;");
    expect(lines[2]).toBe("in_002;Mario Rossi;mario@example.com;123.45;USD;2026-10-01;Recuperato;2026-10-05");
    expect(lines).toHaveLength(3);
  });

  it("con dunningByInvoice aggiunge la colonna Tentativi (0 se assente)", () => {
    const csv = transactionsToCsv([tx(), tx({ invoiceId: "in_002", status: "perso" })], { in_001: { attempts: 3 } });
    const lines = csv.slice(1).split("\n");
    expect(lines[0].endsWith(";Tentativi Dunning")).toBe(true);
    expect(lines[1].endsWith(";3")).toBe(true);
    expect(lines[2]).toBe("in_002;Mario Rossi;mario@example.com;49.00;EUR;2026-10-01;Perso;;0");
  });

  it("quota i campi con ';' senza rompere le colonne", () => {
    const csv = transactionsToCsv([tx({ customerName: "Rossi; Mario" })]);
    expect(csv.slice(1).split("\n")[1]).toBe('in_001;"Rossi; Mario";mario@example.com;49.00;EUR;2026-10-01;In corso;');
  });

  it("solo intestazione con lista vuota", () => {
    expect(transactionsToCsv([])).toBe(BOM + "ID Fattura;Cliente;Email;Importo;Valuta;Data Fallimento;Stato;Data Recupero");
  });

  // La neutralizzazione delle formule vale anche nell'export reale.
  it("non esporta formule eseguibili dal nome cliente", () => {
    const csv = transactionsToCsv([tx({ customerName: "=HYPERLINK(\"http://evil\")" })]);
    const cell = csv.slice(1).split("\n")[1].split(";")[1];
    expect(cell.replace(/^"/, "")).not.toMatch(/^[=+\-@]/);
  });
});
