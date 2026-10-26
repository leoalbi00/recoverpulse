import { describe, expect, it } from "vitest";

import { computePlanRecommendation } from "@/lib/plan-recommendation";
import type { FailedTransaction } from "@/lib/transactions";
import type { TrialStatus } from "@/lib/trial";

const NOW = new Date("2026-10-26T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function txs(count: number, daysAgo: number): FailedTransaction[] {
  return Array.from({ length: count }, (_, i) => ({
    createdAt: new Date(NOW.getTime() - daysAgo * DAY).toISOString(),
    invoiceId: `in_${daysAgo}_${i}`,
  })) as FailedTransaction[];
}

const NO_TRIAL: TrialStatus = {
  connected: false,
  trialStartedAt: null,
  trialEndsAt: null,
  daysRemaining: null,
  isExpired: false,
};

const ACTIVE_TRIAL: TrialStatus = {
  connected: true,
  trialStartedAt: new Date(NOW.getTime() - 5 * DAY).toISOString(),
  trialEndsAt: new Date(NOW.getTime() + 9 * DAY).toISOString(),
  daysRemaining: 9,
  isExpired: false,
};

describe("computePlanRecommendation", () => {
  it("con nessuna transazione consiglia starter come upgrade se non c'è un piano", () => {
    expect(computePlanRecommendation([], NO_TRIAL, null, NOW)).toEqual({
      volume: 0,
      windowLabel: "negli ultimi 30 giorni",
      recommendedPlanId: "starter",
      action: "upgrade",
    });
  });

  it("usa i limiti inclusivi dei piani (100 -> starter, 101 -> growth, 501 -> scale)", () => {
    expect(computePlanRecommendation(txs(100, 1), NO_TRIAL, null, NOW).recommendedPlanId).toBe("starter");
    expect(computePlanRecommendation(txs(101, 1), NO_TRIAL, null, NOW).recommendedPlanId).toBe("growth");
    expect(computePlanRecommendation(txs(500, 1), NO_TRIAL, null, NOW).recommendedPlanId).toBe("growth");
    expect(computePlanRecommendation(txs(501, 1), NO_TRIAL, null, NOW).recommendedPlanId).toBe("scale");
  });

  it("conta solo gli ultimi 30 giorni fuori dal trial", () => {
    const list = [...txs(3, 10), ...txs(4, 31), ...txs(2, 30)];
    // 30 giorni esatti = estremo incluso (>= windowStart)
    expect(computePlanRecommendation(list, NO_TRIAL, "starter", NOW).volume).toBe(5);
  });

  it("durante il trial attivo conta dall'inizio del trial", () => {
    const list = [...txs(3, 2), ...txs(4, 6)];
    const rec = computePlanRecommendation(list, ACTIVE_TRIAL, null, NOW);
    expect(rec.volume).toBe(3);
    expect(rec.windowLabel).toBe("nei 14 giorni di prova");
  });

  it("con trial scaduto torna alla finestra di 30 giorni", () => {
    const rec = computePlanRecommendation(txs(2, 6), { ...ACTIVE_TRIAL, isExpired: true }, null, NOW);
    expect(rec.windowLabel).toBe("negli ultimi 30 giorni");
    expect(rec.volume).toBe(2);
  });

  it("calcola upgrade / downgrade / keep rispetto al piano corrente", () => {
    expect(computePlanRecommendation(txs(200, 1), NO_TRIAL, "starter", NOW).action).toBe("upgrade");
    expect(computePlanRecommendation(txs(10, 1), NO_TRIAL, "scale", NOW).action).toBe("downgrade");
    expect(computePlanRecommendation(txs(200, 1), NO_TRIAL, "growth", NOW).action).toBe("keep");
    expect(computePlanRecommendation(txs(10_000, 1), NO_TRIAL, "scale", NOW).action).toBe("keep");
  });
});
