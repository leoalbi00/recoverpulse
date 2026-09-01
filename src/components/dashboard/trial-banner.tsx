import { Sparkles } from "lucide-react";

import type { TrialStatus } from "@/lib/trial";

/**
 * Solo informativo (nessun blocco d'accesso in questa fase, vedi
 * src/lib/trial.ts): mostra quanto resta della prova di 14 giorni, legata
 * allo Stripe account collegato invece che alla registrazione.
 *
 * Renderizzato ESCLUSIVAMENTE quando la prova è effettivamente attiva a DB
 * (account Stripe collegato, `trial_started_at` valido e non ancora scaduto).
 * Nessun banner per account senza trial, con trial scaduta o in attesa di
 * primo collegamento Stripe: quei casi restano gestiti da PaywallUnlockCard
 * (src/components/dashboard/paywall-unlock-card.tsx) sulla dashboard stessa.
 */
export function TrialBanner({ trial }: { trial: TrialStatus }) {
  if (!trial.connected || trial.isExpired || trial.daysRemaining === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 border-b border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-200 md:px-8">
      <Sparkles className="size-3.5 shrink-0" />
      {trial.daysRemaining} {trial.daysRemaining === 1 ? "giorno rimasto" : "giorni rimasti"} di prova gratuita.
    </div>
  );
}
