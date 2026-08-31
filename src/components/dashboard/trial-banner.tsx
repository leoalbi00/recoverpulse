import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";

import type { TrialStatus } from "@/lib/trial";

/**
 * Solo informativo (nessun blocco d'accesso in questa fase, vedi
 * src/lib/trial.ts): mostra quanto resta della prova di 14 giorni, legata
 * allo Stripe account collegato invece che alla registrazione.
 */
export function TrialBanner({ trial }: { trial: TrialStatus }) {
  if (!trial.connected) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-200 md:px-8">
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          Collega il tuo account Stripe per iniziare la prova gratuita di 14 giorni.
        </span>
        <Link
          href="/dashboard/impostazioni"
          className="shrink-0 font-medium underline underline-offset-2 hover:text-amber-100"
        >
          Vai a Impostazioni
        </Link>
      </div>
    );
  }

  if (trial.isExpired) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-400/20 bg-rose-400/10 px-4 py-2 text-xs text-rose-200 md:px-8">
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 shrink-0" />
          La tua prova gratuita di 14 giorni è scaduta.
        </span>
        <Link
          href="/dashboard/impostazioni"
          className="shrink-0 font-medium underline underline-offset-2 hover:text-rose-100"
        >
          Scegli un piano
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 border-b border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-200 md:px-8">
      <Sparkles className="size-3.5 shrink-0" />
      {trial.daysRemaining} {trial.daysRemaining === 1 ? "giorno rimasto" : "giorni rimasti"} di prova gratuita.
    </div>
  );
}
