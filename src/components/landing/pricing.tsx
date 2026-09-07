import { ArrowRight, Check, Lock, Shield, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PilotRequestForm } from "@/components/landing/pilot-request-form";
import { PLANS } from "@/lib/plans";
import { BETA_HEADLINE, BETA_SUBHEADLINE } from "@/lib/beta";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-16 py-28 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="h-auto rounded-full bg-emerald-500 px-3 py-1 text-zinc-950">
            Beta Gratuita
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            {BETA_HEADLINE}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            {BETA_SUBHEADLINE} Accesso completo e illimitato a tutte le
            funzionalità di dunning via Email, nessuna carta di credito
            richiesta.
          </p>
          <Button
            size="lg"
            render={<a href="/start-trial" />}
            className="mt-8 h-12 gap-2 rounded-full px-8 text-base font-semibold shadow-lg shadow-emerald-500/20"
          >
            Inizia Gratis
            <ArrowRight className="size-4" data-icon="inline-end" />
          </Button>
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <Badge
            variant="outline"
            className="h-auto gap-1.5 rounded-full border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-400"
          >
            <Lock className="size-3.5" />
            In arrivo con la versione Pro
          </Badge>
          <p className="mt-3 text-sm text-zinc-500">
            Al termine della fase Beta, questi piani a pagamento sbloccheranno il dunning multi-canale
            (SMS &amp; WhatsApp) e volumi più alti. Durante la Beta restano solo un&apos;anteprima, non
            acquistabili.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 items-stretch gap-6 opacity-60 grayscale lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.id} className="relative h-full">
              {plan.popular && (
                <Badge className="absolute top-0 left-1/2 z-10 h-auto -translate-x-1/2 -translate-y-1/2 gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-zinc-950 shadow-lg shadow-emerald-500/30">
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

                <Button
                  size="lg"
                  type="button"
                  disabled
                  variant={plan.popular ? "default" : "outline"}
                  className="mt-8 h-12 w-full rounded-full text-base font-semibold"
                >
                  Prossimamente
                </Button>

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

        <div className="mt-16 flex items-center gap-4 text-xs font-medium text-zinc-600">
          <span className="h-px flex-1 bg-zinc-800" />
          oppure, per volumi più alti
          <span className="h-px flex-1 bg-zinc-800" />
        </div>

        <div className="mt-6 flex flex-col items-center gap-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-8 sm:flex-row sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Shield className="size-5 text-emerald-400" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-zinc-100">Pay for Performance</p>
                <Badge className="h-auto rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs text-zinc-950">
                  Rischio Zero
                </Badge>
                <Badge
                  variant="outline"
                  className="h-auto rounded-full border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-400"
                >
                  Opzione Enterprise · su misura per alti volumi
                </Badge>
              </div>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-zinc-400">
                Un&apos;alternativa ai piani mensili qui sopra, pensata per chi
                gestisce volumi elevati di fatture: niente canone fisso, paghi
                solo una piccola commissione sul fatturato che recuperiamo per
                te. Se non recuperiamo nulla, non paghi nulla.
              </p>
            </div>
          </div>
          <Button
            size="lg"
            variant="outline"
            render={<a href="#pilot" />}
            className="h-11 shrink-0 rounded-full border-emerald-500/40 bg-zinc-950 px-6 text-sm font-semibold text-emerald-400 hover:bg-zinc-900 hover:text-emerald-300"
          >
            Richiedi Info
          </Button>
        </div>

        <div id="pilot" className="mt-24 scroll-mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge
              variant="outline"
              className="h-auto rounded-full border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-300"
            >
              Integrazione Pilota
            </Badge>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              Non sei sicuro da dove iniziare? Parliamone.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">
              Richiedi un&apos;integrazione pilota: colleghiamo il tuo account
              Stripe di test e ti mostriamo il fatturato recuperabile con i
              tuoi dati reali, senza impegno.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-10">
            <PilotRequestForm />
          </div>
        </div>
      </div>
    </section>
  );
}
