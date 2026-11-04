"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Calculator } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DEFAULT_MRR,
  MAX_MRR,
  MIN_MRR,
  MRR_STEP,
  computeRoi,
  formatEuro as formatCurrency,
  sliderProgress,
} from "@/lib/roi";
import { cn } from "@/lib/utils";

// Formula, assunzioni e formattazione in src/lib/roi.ts (testate in tests/unit/roi.test.ts).

function Amount({ value, className }: { value: number; className?: string }) {
  return <p className={className}>{formatCurrency(value)}</p>;
}

export function RoiCalculator() {
  const [mrr, setMrr] = useState(DEFAULT_MRR);

  const { atRisk, recoverableMonthly, recoverableYearly } = useMemo(() => computeRoi(mrr), [mrr]);

  const progress = sliderProgress(mrr);

  return (
    <section id="roi-calculator" className="relative scroll-mt-16 py-28 sm:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="outline"
            className="h-auto rounded-full bg-card px-3 py-1 text-slate-700"
          >
            <Calculator className="size-3.5 text-emerald-600" />
            Calcolatore ROI
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Quanto fatturato stai già perdendo?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Inserisci il tuo fatturato mensile ricorrente e scopri all&apos;istante
            quanto potresti recuperare ogni mese con OmniRev.
          </p>
        </div>

        <div className="mt-14 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-slate-900/5 sm:p-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <label htmlFor="mrr-input" className="text-sm font-medium text-slate-700">
              Il tuo fatturato mensile ricorrente (MRR)
            </label>
            <Amount value={mrr} className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl" />
          </div>

          <input
            id="mrr-input"
            type="range"
            min={MIN_MRR}
            max={MAX_MRR}
            step={MRR_STEP}
            value={mrr}
            aria-valuetext={formatCurrency(mrr)}
            onChange={(event) => setMrr(Number(event.target.value))}
            style={{ "--range-progress": `${progress}%` } as React.CSSProperties}
            className="roi-slider mt-6 w-full"
          />
          <div className="mt-1.5 flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatCurrency(MIN_MRR)}</span>
            <span>{formatCurrency(MAX_MRR)}</span>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted p-5 text-center">
              <p className="text-xs text-muted-foreground">Fatturato a rischio / mese</p>
              <Amount value={atRisk} className="mt-2 text-2xl font-semibold text-foreground" />
              <p className="mt-1 text-[11px] text-muted-foreground">~9% del MRR in media</p>
            </div>
            <div className="rounded-xl border border-emerald-600/25 bg-emerald-50 p-5 text-center">
              <p className="text-xs font-medium text-emerald-800">Recuperabile / mese con OmniRev</p>
              <Amount value={recoverableMonthly} className="mt-2 text-3xl font-semibold text-emerald-700" />
              <p className="mt-1 text-[11px] text-emerald-800">fino al 40% recuperato</p>
            </div>
            <div className="rounded-xl border border-border bg-muted p-5 text-center">
              <p className="text-xs text-muted-foreground">Recuperabile / anno</p>
              <Amount value={recoverableYearly} className="mt-2 text-2xl font-semibold text-foreground" />
              <p className="mt-1 text-[11px] text-muted-foreground">proiezione a 12 mesi</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
            <p className="max-w-sm text-center text-xs text-muted-foreground sm:text-left">
              Stima basata su un tasso medio di pagamenti falliti del 9% dell&apos;MRR
              e un tasso di recupero del 40%. I risultati reali variano in base
              al settore e ai canali dunning attivati.
            </p>
            {/* Link stilizzato da bottone: <Button render={<a/>}> di Base UI aggiunge type/role "button"
                a un <a> (warning in console e semantica errata per gli screen reader). */}
            <a
              href="/start-trial"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 shrink-0 gap-2 rounded-full px-6 text-sm font-semibold shadow-lg shadow-slate-900/10"
              )}
            >
              Recupera {formatCurrency(recoverableMonthly)}/mese
              <ArrowRight className="size-4" data-icon="inline-end" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
