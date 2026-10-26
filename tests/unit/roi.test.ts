import { describe, expect, it } from "vitest";

import {
  AVERAGE_FAILED_PAYMENT_RATE,
  DEFAULT_MRR,
  MAX_MRR,
  MIN_MRR,
  MRR_STEP,
  RECOVERY_RATE,
  clampMrr,
  computeRoi,
  formatEuro,
  sliderProgress,
} from "@/lib/roi";

// Formula attesa, calcolata in centesimi interi per evitare errori di virgola mobile:
// atRisk = MRR * 9%, mensile = atRisk * 40%, annuale = mensile * 12.
function expected(mrr: number) {
  const cents = Math.round(mrr * 100);
  const atRiskCents = (cents * 9) / 100;
  const monthlyCents = (atRiskCents * 40) / 100;
  return {
    atRisk: Math.round(atRiskCents) / 100,
    recoverableMonthly: Math.round(monthlyCents) / 100,
    recoverableYearly: Math.round(monthlyCents * 12) / 100,
  };
}

/** Intl usa NBSP (U+00A0) tra cifra e simbolo e il punto come separatore delle migliaia. */
const nbsp = (s: string) => s.replace(/ /g, " ");

describe("costanti del calcolatore ROI", () => {
  it("dichiara gli stessi tassi riportati nel copy (9% e 40%)", () => {
    expect(AVERAGE_FAILED_PAYMENT_RATE).toBe("0.09");
    expect(RECOVERY_RATE).toBe("0.4");
  });

  it("ha un intervallo coerente con lo step dello slider", () => {
    expect(MIN_MRR).toBeLessThan(MAX_MRR);
    expect((MAX_MRR - MIN_MRR) % MRR_STEP).toBe(0);
    expect((DEFAULT_MRR - MIN_MRR) % MRR_STEP).toBe(0);
    expect(DEFAULT_MRR).toBeGreaterThanOrEqual(MIN_MRR);
    expect(DEFAULT_MRR).toBeLessThanOrEqual(MAX_MRR);
  });
});

describe("computeRoi", () => {
  it("calcola il valore di default (20.000 €)", () => {
    expect(computeRoi(20000)).toEqual({ atRisk: 1800, recoverableMonthly: 720, recoverableYearly: 8640 });
  });

  it("calcola gli estremi dello slider", () => {
    expect(computeRoi(MIN_MRR)).toEqual({ atRisk: 90, recoverableMonthly: 36, recoverableYearly: 432 });
    expect(computeRoi(MAX_MRR)).toEqual({ atRisk: 18000, recoverableMonthly: 7200, recoverableYearly: 86400 });
  });

  it("rispetta la formula per ogni posizione raggiungibile dello slider", () => {
    for (let mrr = MIN_MRR; mrr <= MAX_MRR; mrr += MRR_STEP) {
      expect(computeRoi(mrr), `MRR ${mrr}`).toEqual(expected(mrr));
    }
  });

  it("è esatto in decimale dove il float sbaglia (0.09 * 0.4)", () => {
    // In float 1001 * 0.09 * 0.4 = 36.035999999999994: con BigNumber resta 36.036 -> 36.04.
    expect(computeRoi(1001).recoverableMonthly).toBe(36.04);
    expect(computeRoi(1001).atRisk).toBe(90.09);
  });

  it("non produce mai NaN/Infinity, anche con input fuori dominio", () => {
    for (const input of [0, -1, -1e9, NaN, Infinity, -Infinity, 1e15, Number.MAX_SAFE_INTEGER, 0.5]) {
      const result = computeRoi(input);
      for (const value of Object.values(result)) {
        expect(Number.isFinite(value), `${input} -> ${value}`).toBe(true);
        expect(value).toBeGreaterThan(0);
      }
    }
  });

  it("riporta gli input fuori intervallo agli estremi", () => {
    expect(computeRoi(0)).toEqual(computeRoi(MIN_MRR));
    expect(computeRoi(NaN)).toEqual(computeRoi(MIN_MRR));
    expect(computeRoi(1e12)).toEqual(computeRoi(MAX_MRR));
    expect(clampMrr(Infinity)).toBe(MAX_MRR);
    expect(clampMrr(-Infinity)).toBe(MIN_MRR);
    expect(clampMrr(50000)).toBe(50000);
  });

  it("annuale = 12 x mensile e mensile = 40% del rischio", () => {
    for (const mrr of [1000, 1500, 37500, 123500, 199500]) {
      const r = computeRoi(mrr);
      expect(r.recoverableYearly).toBeCloseTo(r.recoverableMonthly * 12, 6);
      expect(r.recoverableMonthly).toBeCloseTo(r.atRisk * 0.4, 6);
    }
  });
});

describe("sliderProgress", () => {
  it("va da 0 a 100 sugli estremi ed è monotona", () => {
    expect(sliderProgress(MIN_MRR)).toBe(0);
    expect(sliderProgress(MAX_MRR)).toBe(100);
    expect(sliderProgress(0)).toBe(0);
    expect(sliderProgress(1e9)).toBe(100);
    expect(sliderProgress(100500)).toBe(50);
  });
});

describe("formatEuro (it-IT)", () => {
  it("formatta in euro senza decimali con separatore delle migliaia italiano", () => {
    expect(formatEuro(20000)).toBe(nbsp("20.000 €"));
    expect(formatEuro(200000)).toBe(nbsp("200.000 €"));
    expect(formatEuro(8640)).toBe(nbsp("8640 €")); // it-IT non raggruppa le cifre sotto 10.000
    expect(formatEuro(720)).toBe(nbsp("720 €"));
    expect(formatEuro(0)).toBe(nbsp("0 €"));
  });

  it("arrotonda i centesimi all'euro", () => {
    expect(formatEuro(36.04)).toBe(nbsp("36 €"));
    expect(formatEuro(36.5)).toBe(nbsp("37 €"));
  });
});
