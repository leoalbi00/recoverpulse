import Link from "next/link";
import { Sparkles } from "lucide-react";

import type { TrialStatus } from "@/lib/trial";

/**
 * Mostra quanto resta della prova di 14 giorni (src/lib/trial.ts riconcilia
 * la prova a livello di account, `users.trial_ends_at`, con quella storica
 * legata allo Stripe account collegato).
 *
 * Renderizzato ESCLUSIVAMENTE quando la prova è effettivamente attiva a DB
 * (`trial_ends_at`/`trial_started_at` valido e non ancora scaduto). Nessun
 * banner per account senza trial o con trial scaduta: quest'ultimo caso
 * resta gestito da PaywallUnlockCard (src/components/dashboard/paywall-unlock-card.tsx),
 * mostrata al posto dei report avanzati.
 */
export function TrialBanner({ trial }: { trial: TrialStatus }) {
  if (!trial.connected || trial.isExpired || trial.daysRemaining === null) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-200 md:px-8">
      <span className="flex items-center gap-1.5">
        <Sparkles className="size-3.5 shrink-0" />
        Ti restano {trial.daysRemaining} {trial.daysRemaining === 1 ? "giorno" : "giorni"} di prova gratuita.
      </span>
      <Link
        href="/dashboard/impostazioni#abbonamento"
        className="font-semibold underline decoration-emerald-300/50 underline-offset-2 hover:text-emerald-100"
      >
        Attiva l&apos;abbonamento
      </Link>
    </div>
  );
}
