import { AlertTriangle, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";
import { SecurityBadgeRow } from "@/components/landing/security-badges";

/** Hero statica: headline, CTA e badge di sicurezza, con l'anteprima della dashboard subito sotto. */
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.07)_1px,transparent_0)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_20%,transparent_75%)]"
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <Badge variant="outline" className="h-auto gap-1.5 rounded-full bg-card px-3 py-1.5 text-slate-700 shadow-sm">
          <AlertTriangle className="size-3.5 text-amber-600" />
          Stime di settore: il churn involontario può pesare fino al 9% dell&apos;MRR
        </Badge>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl xl:text-6xl">
          Riduci il <span className="text-emerald-700">churn involontario</span> da pagamenti rifiutati su
          Stripe.
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
          OmniRev ti aiuta a recuperare il fatturato perso: classifica ogni rifiuto, ritenta l&apos;addebito al
          momento giusto e manda al cliente un link 1-click per aggiornare la carta. Il tuo team non insegue
          nessuno.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <a href="/start-trial" className={cn(buttonVariants({ size: "lg" }), "h-12 gap-2 rounded-full px-8 text-base font-semibold shadow-lg shadow-slate-900/10")}>
            Inizia il recupero gratuito
            <ArrowRight className="size-4" data-icon="inline-end" />
          </a>
          <a href="#roi-calculator" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 rounded-full px-8 text-base font-medium")}>
            Calcola quanto stai perdendo
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Gratis durante la Beta · Nessuna carta di credito · Stripe collegato in 1 click
        </p>

        <SecurityBadgeRow className="mt-4 hidden sm:flex" />
      </div>

      <div className="mx-auto mt-14 w-full max-w-3xl px-4 sm:mt-16 sm:px-6">
        <DashboardMockup />
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Anteprima illustrativa: nomi, importi e percentuali sono dati di esempio, non risultati di clienti reali.
        </p>
      </div>
    </section>
  );
}
