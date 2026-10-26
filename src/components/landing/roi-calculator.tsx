"use client";

import { useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { ArrowRight, Calculator } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Assunzioni usate per la stima, dichiarate esplicitamente sotto al widget:
// il tasso di pagamenti falliti è una media di settore per business in
// abbonamento, il tasso di recupero è quello dichiarato in Hero per
// OmniRev. Numeri indicativi, non una previsione garantita.
// Tassi come stringhe per BigNumber: 0.09 e 0.4 non sono rappresentabili
// esattamente in virgola mobile, il calcolo resta in decimale esatto e si
// arrotonda al centesimo solo alla fine.
const AVERAGE_FAILED_PAYMENT_RATE = "0.09";
const RECOVERY_RATE = "0.4";

const MIN_MRR = 1000;
const MAX_MRR = 200000;
const DEFAULT_MRR = 20000;
const STEP = 500;

const CURRENCY_FORMAT = {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
} as const satisfies Intl.NumberFormatOptions;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", CURRENCY_FORMAT).format(value);
}

/** Importo in euro arrotondato al centesimo (half-even, come in contabilità). */
function toEuros(value: BigNumber): number {
  return value.decimalPlaces(2, BigNumber.ROUND_HALF_EVEN).toNumber();
}

function Amount({ value, className }: { value: number; className?: string }) {
  return <p className={className}>{formatCurrency(value)}</p>;
}

export function RoiCalculator() {
  const [mrr, setMrr] = useState(DEFAULT_MRR);

  const { atRisk, recoverableMonthly, recoverableYearly } = useMemo(() => {
    const risk = new BigNumber(mrr).times(AVERAGE_FAILED_PAYMENT_RATE);
    const monthly = risk.times(RECOVERY_RATE);
    return {
      atRisk: toEuros(risk),
      recoverableMonthly: toEuros(monthly),
      recoverableYearly: toEuros(monthly.times(12)),
    };
  }, [mrr]);

  const progress = ((mrr - MIN_MRR) / (MAX_MRR - MIN_MRR)) * 100;

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
            step={STEP}
            value={mrr}
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
            <Button
              size="lg"
              render={<a href="/start-trial" />}
              className="h-11 shrink-0 gap-2 rounded-full px-6 text-sm font-semibold shadow-lg shadow-slate-900/10"
            >
              Recupera {formatCurrency(recoverableMonthly)}/mese
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
