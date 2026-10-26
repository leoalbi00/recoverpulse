import { describe, expect, it } from "vitest";

import {
  categorizeGatewayError,
  computeNextRetryAt,
  isRetryBypassCategory,
} from "@/lib/dunning-error-categorization";

// TZ=Europe/Rome impostato in vitest.config.mts: le date qui sotto sono ora locale.

describe("categorizeGatewayError", () => {
  it.each([
    ["insufficient_funds", "insufficient_funds"],
    ["AM04", "insufficient_funds"],
    ["expired_card", "expired_card"],
    ["card_declined", "invalid_card"],
    ["do_not_honor", "invalid_card"],
    [" MD01 ", "invalid_card"],
    ["mandate_cancelled", "invalid_card"],
    ["processing_error", "bank_system_error"],
    ["ms03", "bank_system_error"],
    ["something_new", "other"],
  ])("code %s -> %s", (code, category) => {
    expect(categorizeGatewayError({ code })).toBe(category);
  });

  it("usa il declineCode quando il code è generico", () => {
    expect(categorizeGatewayError({ code: "card_declined", declineCode: "insufficient_funds" })).toBe("invalid_card");
    expect(categorizeGatewayError({ code: null, declineCode: "insufficient_funds" })).toBe("insufficient_funds");
    expect(categorizeGatewayError({ code: "unknown", declineCode: "expired_card" })).toBe("expired_card");
  });

  it("dà priorità alla carta scaduta sugli altri codici dello stesso candidato", () => {
    expect(categorizeGatewayError({ code: "expired_card", declineCode: "processing_error" })).toBe("expired_card");
  });

  it("ricade sul messaggio solo senza codici noti", () => {
    expect(categorizeGatewayError({ message: "La carta è scaduta" })).toBe("expired_card");
    expect(categorizeGatewayError({ message: "Your card has EXPIRED." })).toBe("expired_card");
    expect(categorizeGatewayError({ message: "Fondi insufficienti" })).toBe("insufficient_funds");
    expect(categorizeGatewayError({ message: "Insufficient funds" })).toBe("insufficient_funds");
    expect(categorizeGatewayError({ message: "Errore generico" })).toBe("other");
    expect(categorizeGatewayError({ code: "insufficient_funds", message: "card expired" })).toBe("insufficient_funds");
  });

  it("gestisce input vuoti / null senza lanciare", () => {
    expect(categorizeGatewayError({})).toBe("other");
    expect(categorizeGatewayError({ code: "", declineCode: null, message: "" })).toBe("other");
    expect(categorizeGatewayError({ code: "   " })).toBe("other");
  });
});

describe("isRetryBypassCategory", () => {
  it("bypassa i ritentativi solo per carta scaduta / non valida", () => {
    expect(isRetryBypassCategory("expired_card")).toBe(true);
    expect(isRetryBypassCategory("invalid_card")).toBe(true);
    expect(isRetryBypassCategory("insufficient_funds")).toBe(false);
    expect(isRetryBypassCategory("bank_system_error")).toBe(false);
    expect(isRetryBypassCategory("other")).toBe(false);
  });
});

describe("computeNextRetryAt", () => {
  const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);

  it("insufficient_funds: prossimo 1° o 15° del mese alle 9:00", () => {
    expect(computeNextRetryAt("insufficient_funds", local(2026, 10, 3, 12))).toEqual(local(2026, 10, 15, 9));
    expect(computeNextRetryAt("insufficient_funds", local(2026, 10, 15, 8, 59))).toEqual(local(2026, 10, 15, 9));
    expect(computeNextRetryAt("insufficient_funds", local(2026, 10, 15, 9))).toEqual(local(2026, 11, 1, 9));
    expect(computeNextRetryAt("insufficient_funds", local(2026, 10, 1, 7))).toEqual(local(2026, 10, 1, 9));
  });

  it("insufficient_funds: scavalla l'anno a dicembre", () => {
    expect(computeNextRetryAt("insufficient_funds", local(2026, 12, 20))).toEqual(local(2027, 1, 1, 9));
  });

  it("il risultato è sempre nel futuro", () => {
    for (let day = 1; day <= 31; day++) {
      for (const hour of [0, 9, 23]) {
        const now = local(2026, 1, day, hour);
        const next = computeNextRetryAt("insufficient_funds", now)!;
        expect(next.getTime()).toBeGreaterThan(now.getTime());
      }
    }
  });

  it("bank_system_error: +36h", () => {
    const now = new Date("2026-10-26T10:00:00Z");
    expect(computeNextRetryAt("bank_system_error", now)?.toISOString()).toBe("2026-10-27T22:00:00.000Z");
  });

  it("nessun retry automatico per le altre categorie", () => {
    for (const c of ["expired_card", "invalid_card", "other"] as const) {
      expect(computeNextRetryAt(c, new Date())).toBeNull();
    }
  });
});
