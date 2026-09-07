import "server-only";

import { getTrialStatus, type TrialStatus } from "@/lib/trial";
import { getBillingInfoForUser } from "@/lib/billing";

export type PaywallStatus = {
  locked: boolean;
  trial: TrialStatus;
  hasActiveSubscription: boolean;
};

/**
 * RecoverPulse è in Beta Gratuita Pubblica: il paywall a prova scaduta è
 * temporaneamente disattivato per TUTTI gli utenti (nuovi e storici), non
 * solo per chi viene taggato `subscription_plan: "free_beta"` alla
 * registrazione (vedi trial-signup/complete e register routes) — così un
 * account creato prima di questa modifica non resta bloccato. `locked` è
 * quindi sempre `false`; `trial`/`hasActiveSubscription` restano calcolati
 * per uso puramente informativo (es. TrialBanner, SubscriptionOverviewPanel)
 * finché la Beta non termina, momento in cui basterà ripristinare la riga
 * commentata sotto per riattivare il paywall.
 */
export async function getPaywallStatus(userId: string): Promise<PaywallStatus> {
  const [trial, billing] = await Promise.all([getTrialStatus(userId), getBillingInfoForUser(userId)]);
  const hasActiveSubscription =
    billing.subscriptionStatus === "active" || billing.subscriptionStatus === "trialing";
  // const locked = trial.connected && trial.isExpired && !hasActiveSubscription;
  const locked = false;
  return { locked, trial, hasActiveSubscription };
}
