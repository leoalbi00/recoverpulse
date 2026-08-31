import "server-only";

import { getConnectedAccountForUser } from "@/lib/connected-stripe-accounts";

const TRIAL_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export type TrialStatus = {
  /** L'utente ha un account Stripe collegato: senza collegamento la prova non è ancora iniziata. */
  connected: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  daysRemaining: number | null;
  isExpired: boolean;
};

/**
 * Stato della prova di 14 giorni, legata a `connected_stripe_accounts.trial_started_at`
 * (mai all'email di registrazione, vedi src/lib/connected-stripe-accounts.ts).
 * Solo informativo in questa fase: nessun blocco d'accesso viene applicato
 * qui, la UI mostra un banner (src/components/dashboard/trial-banner.tsx).
 * Non esiste ancora uno stato abbonamento persistito (src/lib/billing.ts è
 * solo in-memory) per costruire un vero paywall su questo dato.
 */
const NOT_CONNECTED: TrialStatus = {
  connected: false,
  trialStartedAt: null,
  trialEndsAt: null,
  daysRemaining: null,
  isExpired: false,
};

export async function getTrialStatus(userId: string): Promise<TrialStatus> {
  // Non lancia mai: chiamata da src/app/dashboard/layout.tsx per OGNI pagina
  // della dashboard (senza try/catch a monte), un errore Supabase qui non
  // deve rompere il render dell'intera dashboard — stesso principio già
  // applicato a src/lib/billing.ts.
  let account;
  try {
    account = await getConnectedAccountForUser(userId);
  } catch (error) {
    console.error("[trial] errore nel recupero dell'account Stripe collegato da Supabase:", error);
    return NOT_CONNECTED;
  }

  if (!account) {
    return NOT_CONNECTED;
  }

  const startedAt = new Date(account.trialStartedAt);
  const endsAt = new Date(startedAt.getTime() + TRIAL_DAYS * DAY_MS);
  const daysRemaining = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / DAY_MS));

  return {
    connected: true,
    trialStartedAt: account.trialStartedAt,
    trialEndsAt: endsAt.toISOString(),
    daysRemaining,
    isExpired: Date.now() >= endsAt.getTime(),
  };
}
