import { ArrowRight, Lock, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PilotRequestForm } from "@/components/landing/pilot-request-form";
import { PricingPlans } from "@/components/landing/pricing-plans";
import { SecurityBadgeRow } from "@/components/landing/security-badges";
import { BETA_HEADLINE, BETA_SUBHEADLINE } from "@/lib/beta";

export function Pricing() {
  return (
    <section id="pricing" className="relative scroll-mt-16 py-28 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="h-auto rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 ring-1 ring-emerald-600/20">
            Beta Gratuita
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {BETA_HEADLINE}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {BETA_SUBHEADLINE} Accesso completo e illimitato a tutte le
            funzionalità di dunning via Email, nessuna carta di credito
            richiesta.
          </p>
          <Button
            size="lg"
            render={<a href="/start-trial" />}
            className="mt-8 h-12 gap-2 rounded-full px-8 text-base font-semibold shadow-lg shadow-slate-900/10"
          >
            Inizia il recupero gratuito
            <ArrowRight className="size-4" data-icon="inline-end" />
          </Button>
          <SecurityBadgeRow className="mt-6" />
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <Badge
            variant="outline"
            className="h-auto gap-1.5 rounded-full bg-card px-3 py-1 text-muted-foreground"
          >
            <Lock className="size-3.5" />
            In arrivo con la versione Pro
          </Badge>
          <p className="mt-3 text-sm text-muted-foreground">
            Al termine della fase Beta, questi piani a pagamento sbloccheranno il dunning multi-canale
            (SMS &amp; WhatsApp) e volumi più alti. Durante la Beta restano solo un&apos;anteprima, non
            acquistabili.
          </p>
        </div>

        <div className="mt-10">
          <PricingPlans />
        </div>

        <div className="mt-16 flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          oppure, per volumi più alti
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="mt-6 flex flex-col items-center gap-6 rounded-2xl border border-emerald-600/20 bg-emerald-50/60 p-8 sm:flex-row sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-600/15">
              <Shield className="size-5 text-emerald-700" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-foreground">Pay for Performance</p>
                <Badge className="h-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-800 ring-1 ring-emerald-600/20">
                  Rischio Zero
                </Badge>
                <Badge
                  variant="outline"
                  className="h-auto rounded-full px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  Opzione Enterprise · su misura per alti volumi
                </Badge>
              </div>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
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
            className="h-11 shrink-0 rounded-full border-emerald-600/40 bg-card px-6 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            Richiedi Info
          </Button>
        </div>

        <div id="pilot" className="mt-24 scroll-mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge
              variant="outline"
              className="h-auto rounded-full bg-card px-3 py-1 text-slate-700"
            >
              Integrazione Pilota
            </Badge>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Non sei sicuro da dove iniziare? Parliamone.
            </h3>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Richiedi un&apos;integrazione pilota: colleghiamo il tuo account
              Stripe di test e ti mostriamo il fatturato recuperabile con i
              tuoi dati reali, senza impegno.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl shadow-slate-900/5 sm:p-10">
            <PilotRequestForm />
          </div>
        </div>
      </div>
    </section>
  );
}
