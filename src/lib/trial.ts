import "server-only";

import { getConnectedAccountForUser } from "@/lib/connected-stripe-accounts";
import { getTrialEndsAtForUser } from "@/lib/users";

const TRIAL_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export type TrialStatus = {
  /** La prova è iniziata (self-serve alla registrazione, o storicamente al collegamento Stripe): senza questo la prova non è ancora partita. */
  connected: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  daysRemaining: number | null;
  isExpired: boolean;
};

const NOT_STARTED: TrialStatus = {
  connected: false,
  trialStartedAt: null,
  trialEndsAt: null,
  daysRemaining: null,
  isExpired: false,
};

function statusFromEndsAt(trialStartedAt: string | null, endsAt: Date): TrialStatus {
  const daysRemaining = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / DAY_MS));
  return {
    connected: true,
    trialStartedAt,
    trialEndsAt: endsAt.toISOString(),
    daysRemaining,
    isExpired: Date.now() >= endsAt.getTime(),
  };
}

/**
 * Stato della prova di 14 giorni, usata da src/lib/paywall.ts per bloccare i
 * report avanzati della dashboard e da src/components/dashboard/trial-banner.tsx
 * per il banner giorni residui.
 *
 * Due fonti, riconciliate qui in un'unica verità (vedi il commento nella
 * migrazione 20260904120000_trial_signup.sql):
 * 1. `users.trial_ends_at`, impostata alla registrazione self-serve
 *    /start-trial (src/app/api/trial-signup/complete/route.ts) — prioritaria
 *    quando presente, perché è la prova "a livello di account" e non
 *    richiede che l'utente abbia già collegato Stripe.
 * 2. In assenza di (1) — utenti creati con la registrazione invito-only
 *    /api/register, che non passa da /start-trial — fallback sulla prova
 *    storica legata a `connected_stripe_accounts.trial_started_at`, iniziata
 *    solo al collegamento dell'account Stripe.
 */
export async function getTrialStatus(userId: string): Promise<TrialStatus> {
  // Non lancia mai: chiamata da src/app/dashboard/layout.tsx per OGNI pagina
  // della dashboard (senza try/catch a monte), un errore Supabase qui non
  // deve rompere il render dell'intera dashboard — stesso principio già
  // applicato a src/lib/billing.ts.
  let trialEndsAt: string | null;
  try {
    trialEndsAt = await getTrialEndsAtForUser(userId);
  } catch (error) {
    console.error("[trial] errore nel recupero della scadenza prova da Supabase:", error);
    trialEndsAt = null;
  }

  if (trialEndsAt) {
    const endsAt = new Date(trialEndsAt);
    const startedAt = new Date(endsAt.getTime() - TRIAL_DAYS * DAY_MS).toISOString();
    return statusFromEndsAt(startedAt, endsAt);
  }

  let account;
  try {
    account = await getConnectedAccountForUser(userId);
  } catch (error) {
    console.error("[trial] errore nel recupero dell'account Stripe collegato da Supabase:", error);
    return NOT_STARTED;
  }

  if (!account) {
    return NOT_STARTED;
  }

  const startedAt = new Date(account.trialStartedAt);
  const endsAt = new Date(startedAt.getTime() + TRIAL_DAYS * DAY_MS);
  return statusFromEndsAt(account.trialStartedAt, endsAt);
}
