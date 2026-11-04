import BigNumber from "bignumber.js";

// Calcolo puro del Calcolatore ROI della landing (src/components/landing/roi-calculator.tsx),
// estratto qui per poterlo testare in isolamento (tests/unit/roi.test.ts).
//
// Assunzioni usate per la stima, dichiarate esplicitamente sotto al widget:
// il tasso di pagamenti falliti è una media di settore per business in
// abbonamento, il tasso di recupero è quello dichiarato in Hero per
// OmniRev. Numeri indicativi, non una previsione garantita.
// Tassi come stringhe per BigNumber: 0.09 e 0.4 non sono rappresentabili
// esattamente in virgola mobile, il calcolo resta in decimale esatto e si
// arrotonda al centesimo solo alla fine.
export const AVERAGE_FAILED_PAYMENT_RATE = "0.09";
export const RECOVERY_RATE = "0.4";

export const MIN_MRR = 1000;
export const MAX_MRR = 200000;
export const DEFAULT_MRR = 20000;
export const MRR_STEP = 500;

export type RoiEstimate = {
  atRisk: number;
  recoverableMonthly: number;
  recoverableYearly: number;
};

/** Importo in euro arrotondato al centesimo (half-even, come in contabilità). */
function toEuros(value: BigNumber): number {
  return value.decimalPlaces(2, BigNumber.ROUND_HALF_EVEN).toNumber();
}

/** Riporta un MRR arbitrario (anche NaN/Infinity/negativo) nell'intervallo del widget. */
export function clampMrr(mrr: number): number {
  if (!Number.isFinite(mrr)) return mrr === Infinity ? MAX_MRR : MIN_MRR;
  return Math.min(MAX_MRR, Math.max(MIN_MRR, mrr));
}

export function computeRoi(mrr: number): RoiEstimate {
  const risk = new BigNumber(clampMrr(mrr)).times(AVERAGE_FAILED_PAYMENT_RATE);
  const monthly = risk.times(RECOVERY_RATE);
  return {
    atRisk: toEuros(risk),
    recoverableMonthly: toEuros(monthly),
    recoverableYearly: toEuros(monthly.times(12)),
  };
}

/** Posizione percentuale (0-100) del cursore, usata per colorare la traccia dello slider. */
export function sliderProgress(mrr: number): number {
  return ((clampMrr(mrr) - MIN_MRR) / (MAX_MRR - MIN_MRR)) * 100;
}

const CURRENCY_FORMAT = {
  style: "currency",
  currency: "EUR",
  // minimumFractionDigits esplicito: senza, EUR ha minimo 2 decimali e un
  // massimo di 0 lancia RangeError sui motori Intl precedenti a NumberFormat v3
  // (es. Safari < 15.4).
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
} as const satisfies Intl.NumberFormatOptions;

const currencyFormatter = new Intl.NumberFormat("it-IT", CURRENCY_FORMAT);

export function formatEuro(value: number): string {
  return currencyFormatter.format(value);
}
