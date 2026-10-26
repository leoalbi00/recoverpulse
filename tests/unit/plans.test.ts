import { describe, expect, it } from "vitest";

import { PLANS } from "@/lib/plans";

describe("PLANS", () => {
  it("contiene starter, growth e scale in ordine crescente di prezzo", () => {
    expect(PLANS.map((p) => p.id)).toEqual(["starter", "growth", "scale"]);
    for (let i = 1; i < PLANS.length; i++) {
      expect(PLANS[i].priceInCents).toBeGreaterThan(PLANS[i - 1].priceInCents);
    }
  });

  it("ha il prezzo testuale coerente con priceInCents", () => {
    for (const plan of PLANS) {
      expect(plan.price).toBe(`$${plan.priceInCents / 100}`);
      expect(Number.isInteger(plan.priceInCents)).toBe(true);
      expect(plan.period).toBe("/mese");
    }
  });

  it("ha esattamente un piano 'popular'", () => {
    expect(PLANS.filter((p) => p.popular)).toHaveLength(1);
  });

  it("ha limiti di fatture crescenti e solo l'ultimo illimitato", () => {
    const limits = PLANS.map((p) => p.monthlyFailedInvoiceLimit);
    expect(limits[limits.length - 1]).toBeNull();
    const finite = limits.slice(0, -1) as number[];
    finite.forEach((l) => expect(l).toBeGreaterThan(0));
    for (let i = 1; i < finite.length; i++) expect(finite[i]).toBeGreaterThan(finite[i - 1]);
  });

  it("riporta nelle feature lo stesso limite usato dal recommendation engine", () => {
    for (const plan of PLANS) {
      if (plan.monthlyFailedInvoiceLimit === null) {
        expect(plan.features.some((f) => /illimitat/i.test(f))).toBe(true);
      } else {
        expect(plan.features.some((f) => f.includes(`${plan.monthlyFailedInvoiceLimit} fatture`))).toBe(true);
      }
    }
  });

  it("ha id, nomi e feature univoci e non vuoti", () => {
    expect(new Set(PLANS.map((p) => p.id)).size).toBe(PLANS.length);
    expect(new Set(PLANS.map((p) => p.name)).size).toBe(PLANS.length);
    for (const plan of PLANS) {
      expect(plan.features.length).toBeGreaterThan(0);
      expect(new Set(plan.features).size).toBe(plan.features.length);
      expect(plan.description.trim()).not.toBe("");
    }
  });
});
