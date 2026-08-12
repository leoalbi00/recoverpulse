import { Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PlanButton } from "@/components/billing/plan-button";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-16 py-28 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="outline"
            className="h-auto rounded-full border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-300"
          >
            Prezzi
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            Un piano per ogni fase di crescita
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            Inizia con 14 giorni di prova gratuita, nessuna carta di credito
            richiesta. Nessun vincolo, disdici quando vuoi.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.id} className="relative h-full">
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 z-10 h-auto -translate-x-1/2 gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-zinc-950">
                  <Sparkles className="size-3.5" />
                  Più Popolare
                </Badge>
              )}

              <div
                className={cn(
                  "flex h-full flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-8 shadow-xl shadow-black/20 backdrop-blur-sm",
                  plan.popular && "ring-2 ring-emerald-500/50"
                )}
              >
                <h3 className="text-lg font-semibold text-zinc-100">
                  {plan.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  {plan.description}
                </p>

                <div className="mt-8 flex items-baseline gap-1">
                  <span className="text-5xl font-semibold tracking-tight text-zinc-100">
                    {plan.price}
                  </span>
                  <span className="text-sm text-zinc-500">{plan.period}</span>
                </div>

                <PlanButton
                  plan={plan}
                  variant={plan.popular ? "default" : "outline"}
                  className="mt-8 h-12 w-full rounded-full text-base font-semibold"
                />

                <ul className="mt-8 flex flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-zinc-300"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
