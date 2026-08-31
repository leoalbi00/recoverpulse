import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PlanButton } from "@/components/billing/plan-button";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import type { TrialStatus } from "@/lib/trial";

/**
 * Sostituisce grafico recupero + performance sequenze in
 * src/components/dashboard/dashboard-overview.tsx quando la prova di 14
 * giorni (legata allo Stripe account collegato, src/lib/trial.ts) è scaduta
 * e non risulta un abbonamento SaaS RecoverPulse attivo (src/lib/paywall.ts).
 */
export function PaywallUnlockCard({ trial }: { trial: TrialStatus }) {
  const expiredOn = trial.trialEndsAt
    ? new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(
        new Date(trial.trialEndsAt)
      )
    : null;

  return (
    <section className="mt-10 scroll-mt-20">
      <div className="rounded-xl border border-zinc-200/80 bg-white p-6 text-center shadow-md sm:p-10">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-amber-100">
          <Lock className="size-5 text-amber-700" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-zinc-900">La tua prova di 14 giorni è scaduta</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-600">
          {expiredOn ? `Terminata il ${expiredOn}. ` : ""}
          Scegli un piano per sbloccare il grafico di recupero, la performance delle sequenze dunning e continuare a
          recuperare pagamenti falliti.
        </p>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-lg border border-zinc-200/80 p-5 text-left",
                plan.popular && "ring-2 ring-emerald-500/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-zinc-900">{plan.name}</p>
                {plan.popular && <Badge className="h-auto px-2 py-0.5">Consigliato</Badge>}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-zinc-900">{plan.price}</span>
                <span className="text-xs text-zinc-600">{plan.period}</span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-600">{plan.description}</p>
              <PlanButton plan={plan} variant={plan.popular ? "default" : "outline"} className="mt-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
