import { afterEach, describe, expect, it, vi } from "vitest";

import { requirePaymentSlots, validatePaymentSlots } from "@/lib/guardrails";

const VALID = { customerId: "cus_1", invoiceId: "in_1", amount: 4900, currency: "EUR" };

describe("validatePaymentSlots", () => {
  it("accetta slot validi normalizzando la valuta in minuscolo e facendo trim", () => {
    expect(validatePaymentSlots({ ...VALID, customerId: "  cus_1 ", currency: " EUR " })).toEqual({
      ok: true,
      slots: { customerId: "cus_1", invoiceId: "in_1", amount: 4900, currency: "eur" },
    });
  });

  it("elenca tutti gli slot mancanti nell'ordine dello schema", () => {
    expect(validatePaymentSlots({})).toEqual({
      ok: false,
      missing: ["customerId", "invoiceId", "amount", "currency"],
    });
    expect(validatePaymentSlots({ customerId: null, invoiceId: null, amount: null, currency: null })).toEqual({
      ok: false,
      missing: ["customerId", "invoiceId", "amount", "currency"],
    });
  });

  it.each([
    ["customerId", "   "],
    ["invoiceId", ""],
    ["amount", 0],
    ["amount", -100],
    ["amount", 49.5],
    ["amount", NaN],
    ["amount", Infinity],
    ["currency", "EU"],
    ["currency", "EURO"],
    ["currency", "€€€"],
    ["currency", "12a"],
  ])("rifiuta %s = %s", (slot, value) => {
    const result = validatePaymentSlots({ ...VALID, [slot]: value });
    expect(result).toEqual({ ok: false, missing: [slot] });
  });

  it("non duplica lo stesso slot se ha più errori", () => {
    const result = validatePaymentSlots({ ...VALID, currency: " 1 " });
    expect(result).toEqual({ ok: false, missing: ["currency"] });
  });
});

describe("requirePaymentSlots", () => {
  afterEach(() => vi.restoreAllMocks());

  it("restituisce gli slot senza loggare se validi", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(requirePaymentSlots("test", VALID)).toEqual({ ...VALID, currency: "eur" });
    expect(warn).not.toHaveBeenCalled();
  });

  it("restituisce null e logga scope + slot mancanti se non validi", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(requirePaymentSlots("stripe-webhook", { ...VALID, amount: 0, currency: null })).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    const message = warn.mock.calls[0][0] as string;
    expect(message).toContain("[stripe-webhook]");
    expect(message).toContain("amount, currency");
    expect(message).toContain("in_1");
  });

  it("usa 'sconosciuta' quando manca l'invoiceId", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    requirePaymentSlots("cron", { ...VALID, invoiceId: "" });
    expect(warn.mock.calls[0][0]).toContain("sconosciuta");
  });
});
