import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/plans";
import { BETA_HEADLINE, BETA_SUBHEADLINE } from "@/lib/beta";

/**
 * Sostituisce SubscriptionCard/SubscriptionOverviewPanel/griglia piani in
 * /dashboard/impostazioni per gli account Beta (subscription_plan
 * "free_beta", taggato alla registrazione — vedi trial-signup/complete e
 * register routes). Chi ha invece un abbonamento reale attivo da prima della
 * Beta continua a vedere il pannello di gestione classico (deciso dal
 * chiamante in impostazioni/page.tsx).
 */
export function BetaStatusCard() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <Sparkles className="size-4 text-emerald-400" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-900">Piano attuale</p>
              <Badge className="h-auto bg-emerald-100 px-2 py-0.5 text-emerald-800">Beta Gratuita</Badge>
            </div>
            <p className="mt-0.5 text-xs text-zinc-600">
              {BETA_HEADLINE} {BETA_SUBHEADLINE} Accesso completo e illimitato a tutte le funzionalità Email,
              nessuna carta di credito richiesta.
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-zinc-500">In arrivo con la versione Pro</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="flex h-full flex-col rounded-xl border border-zinc-200/80 bg-white p-5 text-zinc-900 opacity-60 grayscale shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-900">{plan.name}</p>
                {plan.popular && <Badge className="h-auto px-2 py-0.5">Popolare</Badge>}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xl font-semibold text-zinc-900">{plan.price}</span>
                <span className="text-xs text-zinc-600">{plan.period}</span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-600">{plan.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Questi piani non sono acquistabili durante la Beta: nessuna azione richiesta da parte tua.
        </p>
      </div>
    </div>
  );
}
