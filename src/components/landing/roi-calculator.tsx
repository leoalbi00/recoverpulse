"use client";

import { useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import NumberFlow from "@number-flow/react";
import { ArrowRight, Calculator } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeading } from "@/components/landing/section-heading";

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

const COMPACT_CURRENCY = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const MONTH_LABELS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

type ProjectionPoint = { month: string; value: number };

/** Somma cumulativa mese per mese di un importo mensile costante. */
function cumulative(monthly: BigNumber): ProjectionPoint[] {
  return MONTH_LABELS.map((month, index) => ({ month, value: toEuros(monthly.times(index + 1)) }));
}

type ProjectionTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ value?: unknown }>;
  caption: string;
};

function ProjectionTooltip({ active, label, payload, caption }: ProjectionTooltipProps) {
  const value = payload?.[0]?.value;
  if (!active || typeof value !== "number") return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg shadow-stone-900/10">
      <p className="text-stone-500">
        {caption} · {label}
      </p>
      <p className="mt-0.5 font-semibold text-foreground tabular-nums">{formatCurrency(value)}</p>
    </div>
  );
}

/**
 * Proiezione a 12 mesi, una sola serie per grafico: niente legenda, il
 * titolo della tab nomina la serie e il tooltip dà il valore esatto.
 */
function ProjectionChart({ data, color, caption }: { data: ProjectionPoint[]; color: string; caption: string }) {
  const gradientId = `projection-${color.replace("#", "")}`;
  return (
    <div className="h-48 w-full md:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.12} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e7e5e4" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#78716c", fontSize: 11 }}
            interval="preserveStartEnd"
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: "#78716c", fontSize: 11 }}
            tickFormatter={(value: number) => COMPACT_CURRENCY.format(value)}
          />
          <Tooltip
            cursor={{ stroke: "#d6d3d1", strokeWidth: 1 }}
            content={(props) => <ProjectionTooltip {...props} caption={caption} />}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            activeDot={{ r: 4, fill: color, stroke: "#ffffff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function AnimatedAmount({ value, className }: { value: number; className?: string }) {
  return <NumberFlow value={value} locales="it-IT" format={CURRENCY_FORMAT} className={className} willChange />;
}

export function RoiCalculator() {
  const [mrr, setMrr] = useState(DEFAULT_MRR);

  const { atRisk, recoverableMonthly, recoverableYearly, lostSeries, recoveredSeries } = useMemo(() => {
    const risk = new BigNumber(mrr).times(AVERAGE_FAILED_PAYMENT_RATE);
    const monthly = risk.times(RECOVERY_RATE);
    return {
      atRisk: toEuros(risk),
      recoverableMonthly: toEuros(monthly),
      recoverableYearly: toEuros(monthly.times(12)),
      lostSeries: cumulative(risk),
      recoveredSeries: cumulative(monthly),
    };
  }, [mrr]);

  const progress = ((mrr - MIN_MRR) / (MAX_MRR - MIN_MRR)) * 100;

  return (
    <section id="roi-calculator" aria-labelledby="roi-title" className="scroll-mt-24 py-16 md:py-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 md:gap-16">
        <SectionHeading
          id="roi-title"
          eyebrow="Calcolatore ROI"
          icon={Calculator}
          title="Quanto fatturato stai già perdendo?"
          description="Imposta il tuo fatturato mensile ricorrente e guarda la proiezione a 12 mesi, con e senza OmniRev."
        />

        <div className="flex flex-col gap-8 rounded-2xl border border-border bg-card p-6 shadow-xs md:p-10">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <label htmlFor="mrr-input" className="text-sm font-medium text-muted-foreground">
                Il tuo fatturato mensile ricorrente (MRR)
              </label>
              <AnimatedAmount value={mrr} className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl" />
            </div>
            <div>
              <input
                id="mrr-input"
                type="range"
                min={MIN_MRR}
                max={MAX_MRR}
                step={STEP}
                value={mrr}
                onChange={(event) => setMrr(Number(event.target.value))}
                style={{ "--range-progress": `${progress}%` } as React.CSSProperties}
                className="roi-slider w-full"
              />
              <div className="mt-1.5 flex justify-between text-xs text-stone-500">
                <span>{formatCurrency(MIN_MRR)}</span>
                <span>{formatCurrency(MAX_MRR)}</span>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1 rounded-xl border border-border p-5">
              <dt className="text-xs text-muted-foreground">Fatturato a rischio / mese</dt>
              <dd>
                <AnimatedAmount value={atRisk} className="text-2xl font-semibold text-foreground" />
              </dd>
              <dd className="text-xs text-stone-500">~9% del MRR in media</dd>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <dt className="text-xs text-emerald-800">Recuperabile / mese</dt>
              <dd>
                <AnimatedAmount value={recoverableMonthly} className="text-2xl font-semibold text-emerald-800" />
              </dd>
              <dd className="text-xs text-emerald-800/80">fino al 40% recuperato</dd>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-border p-5">
              <dt className="text-xs text-muted-foreground">Recuperabile / anno</dt>
              <dd>
                <AnimatedAmount value={recoverableYearly} className="text-2xl font-semibold text-foreground" />
              </dd>
              <dd className="text-xs text-stone-500">proiezione a 12 mesi</dd>
            </div>
          </dl>

          <Tabs defaultValue="recovered" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">Proiezione cumulativa a 12 mesi</p>
              <TabsList aria-label="Scenario">
                <TabsTrigger value="recovered">Con OmniRev</TabsTrigger>
                <TabsTrigger value="lost">Senza OmniRev</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="recovered">
              <ProjectionChart data={recoveredSeries} color="#047857" caption="Recuperato" />
            </TabsContent>
            <TabsContent value="lost">
              <ProjectionChart data={lostSeries} color="#78716c" caption="Perso" />
            </TabsContent>
          </Tabs>

          <div className="flex flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
            <p className="max-w-sm text-center text-xs text-stone-500 sm:text-left">
              Stima basata su un tasso medio di pagamenti falliti del 9% dell&apos;MRR e un tasso di recupero del 40%.
              I risultati reali variano in base al settore e ai canali dunning attivati.
            </p>
            <Button
              size="lg"
              render={<a href="/start-trial" />}
              className="h-11 shrink-0 gap-2 rounded-full px-6 text-sm font-semibold"
            >
              Inizia a Recuperare Fatturato
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
