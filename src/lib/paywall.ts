import "server-only";

import { getTrialStatus, type TrialStatus } from "@/lib/trial";
import { getBillingInfoForUser } from "@/lib/billing";

export type PaywallStatus = {
  locked: boolean;
  trial: TrialStatus;
  hasActiveSubscription: boolean;
};

/**
 * Blocca i report avanzati della dashboard (src/components/dashboard/dashboard-overview.tsx)
 * a prova scaduta senza un abbonamento SaaS RecoverPulse attivo. `trial.connected`
 * garantisce che chi non ha ancora collegato Stripe (prova mai iniziata,
 * vedi src/lib/trial.ts) non veda mai il paywall.
 */
export async function getPaywallStatus(userId: string): Promise<PaywallStatus> {
  const [trial, billing] = await Promise.all([getTrialStatus(userId), getBillingInfoForUser(userId)]);
  const hasActiveSubscription =
    billing.subscriptionStatus === "active" || billing.subscriptionStatus === "trialing";
  const locked = trial.connected && trial.isExpired && !hasActiveSubscription;
  return { locked, trial, hasActiveSubscription };
}
