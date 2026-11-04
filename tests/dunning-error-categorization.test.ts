import { describe, expect, it } from "vitest";

import {
  categorizeGatewayError,
  computeNextRetryAt,
  isRetryBypassCategory,
} from "@/lib/dunning-error-categorization";

describe("categorizeGatewayError", () => {
  it("riconosce i codici strutturati del gateway", () => {
    expect(categorizeGatewayError({ code: "expired_card" })).toBe("expired_card");
    expect(categorizeGatewayError({ declineCode: " INSUFFICIENT_FUNDS " })).toBe("insufficient_funds");
  });

  it("ricade sul messaggio solo senza codici noti", () => {
    expect(categorizeGatewayError({ message: "La carta è scaduta" })).toBe("expired_card");
    expect(categorizeGatewayError({ message: "Fondi insufficienti" })).toBe("insufficient_funds");
  });

  it("restituisce 'other' per input vuoti o sconosciuti", () => {
    expect(categorizeGatewayError({})).toBe("other");
    expect(categorizeGatewayError({ code: "boh", message: "errore generico" })).toBe("other");
  });
});

describe("isRetryBypassCategory", () => {
  it("salta i riaddebiti solo quando serve un'azione del cliente", () => {
    expect(isRetryBypassCategory("expired_card")).toBe(true);
    expect(isRetryBypassCategory("invalid_card")).toBe(true);
    expect(isRetryBypassCategory("insufficient_funds")).toBe(false);
    expect(isRetryBypassCategory("other")).toBe(false);
  });
});

describe("computeNextRetryAt", () => {
  it("fondi insufficienti: il prossimo 1 o 15 del mese, sempre nel futuro", () => {
    const now = new Date(2026, 10, 4, 12, 0, 0);
    const next = computeNextRetryAt("insufficient_funds", now)!;
    expect(next.getTime()).toBeGreaterThan(now.getTime());
    expect([1, 15]).toContain(next.getDate());
  });

  it("errore della banca: ritenta dopo 36 ore", () => {
    const now = new Date("2026-11-04T10:00:00Z");
    expect(computeNextRetryAt("bank_system_error", now)?.toISOString()).toBe("2026-11-05T22:00:00.000Z");
  });

  it("nessun tentativo pianificato per le altre categorie", () => {
    expect(computeNextRetryAt("expired_card")).toBeNull();
    expect(computeNextRetryAt("other")).toBeNull();
  });
});
