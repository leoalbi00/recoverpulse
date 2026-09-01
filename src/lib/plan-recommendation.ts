// Funzione pura di calcolo, senza dipendenza da Supabase o altro codice
// server-only: chiamabile da un Server Component (src/app/dashboard/impostazioni/page.tsx)
// senza dover passare per l'endpoint API.

import type { FailedTransaction } from "@/lib/transactions";
import type { TrialStatus } from "@/lib/trial";
import { PLANS, type PlanId } from "@/lib/plans";

const DAY_MS = 24 * 60 * 60 * 1000;

export type PlanRecommendation = {
  /** Fatture fallite gestite nel periodo di riferimento. */
  volume: number;
  /** Descrizione del periodo usato per il conteggio, es. "nei 14 giorni di prova". */
  windowLabel: string;
  recommendedPlanId: PlanId;
  action: "upgrade" | "downgrade" | "keep";
};

/**
 * "Consiglio Abbonamento RecoverPulse" (pannello Accordion Abbonamento in
 * /dashboard/impostazioni): consiglia il piano più piccolo che copre il
 * volume di fatture fallite gestite nel periodo di riferimento — l'intero
 * trial se ancora attivo (non c'è ancora uno storico mensile "vero"),
 * altrimenti gli ultimi 30 giorni, lo stesso periodo su cui sono tarate le
 * soglie "fatture fallite/mese" dei piani (src/lib/plans.ts).
 *
 * `currentPlanId` assente (nessun abbonamento attivo) è trattato come
 * "consiglia comunque il piano adatto" (azione "upgrade": è un invito a
 * sottoscrivere, non c'è un piano da confrontare).
 */
export function computePlanRecommendation(
  transactions: FailedTransaction[],
  trial: TrialStatus,
  currentPlanId: PlanId | null,
  now: Date = new Date()
): PlanRecommendation {
  const onTrial = trial.connected && !trial.isExpired && trial.trialStartedAt !== null;
  const windowStart = onTrial
    ? new Date(trial.trialStartedAt as string).getTime()
    : now.getTime() - 30 * DAY_MS;
  const windowLabel = onTrial ? "nei 14 giorni di prova" : "negli ultimi 30 giorni";

  const volume = transactions.filter((t) => new Date(t.createdAt).getTime() >= windowStart).length;

  const fitting =
    PLANS.find((plan) => plan.monthlyFailedInvoiceLimit === null || volume <= plan.monthlyFailedInvoiceLimit) ??
    PLANS[PLANS.length - 1];

  const currentIndex = currentPlanId ? PLANS.findIndex((plan) => plan.id === currentPlanId) : -1;
  const fittingIndex = PLANS.findIndex((plan) => plan.id === fitting.id);

  const action: PlanRecommendation["action"] =
    currentIndex === -1 || fittingIndex > currentIndex
      ? "upgrade"
      : fittingIndex < currentIndex
        ? "downgrade"
        : "keep";

  return { volume, windowLabel, recommendedPlanId: fitting.id, action };
}
