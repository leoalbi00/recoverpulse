import { Sparkles } from "lucide-react";

import type { TrialStatus } from "@/lib/trial";
import { BETA_HEADLINE, BETA_SUBHEADLINE } from "@/lib/beta";

/**
 * RecoverPulse è in Beta Gratuita Pubblica: il paywall a prova scaduta è
 * disattivato (src/lib/paywall.ts), quindi questo banner non conta più alla
 * rovescia verso un'attivazione a pagamento — è un promemoria persistente
 * dello stato Beta, mostrato a chiunque abbia una prova avviata (`connected`,
 * vedi src/lib/trial.ts). Nessun banner per account senza prova mai avviata
 * (es. invito-only che non ha ancora collegato Stripe).
 */
export function TrialBanner({ trial }: { trial: TrialStatus }) {
  if (!trial.connected) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-center text-xs text-emerald-200 md:px-8">
      <Sparkles className="size-3.5 shrink-0" />
      <span className="font-semibold">{BETA_HEADLINE}</span>
      <span>{BETA_SUBHEADLINE}</span>
    </div>
  );
}
