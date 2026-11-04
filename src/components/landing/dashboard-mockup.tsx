import { ArrowUpRight } from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

// Anteprima statica della dashboard usata dalla Hero (hero.tsx): solo
// markup, Tailwind e un SVG inline, nessuna immagine.

const KPIS = [
  { label: "Recuperato", value: "€12.480", delta: "+18%" },
  { label: "Tasso di recupero", value: "68%", delta: "+6 pt" },
  { label: "In recupero", value: "14", delta: null },
];

const RECENT = [
  { name: "Nova Studio SRL", amount: "€89", status: "recuperato" as const },
  { name: "Blue Ocean Agency", amount: "€199", status: "in_corso" as const },
  { name: "Rossi Consulting", amount: "€39", status: "recuperato" as const },
];

const STATUS = {
  recuperato: { label: "Recuperato", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  in_corso: { label: "In corso", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
};

// Fatturato recuperato per settimana (unità arbitrarie), disegnato come area.
const SERIES = [18, 26, 22, 34, 30, 42, 38, 51, 47, 58, 55, 66];
const CHART_W = 320;
const CHART_H = 96;
const PAD_Y = 8;

const chartPoints = SERIES.map((value, index) => {
  const max = Math.max(...SERIES);
  const x = (index / (SERIES.length - 1)) * CHART_W;
  const y = PAD_Y + (1 - value / max) * (CHART_H - PAD_Y * 2);
  return [x, y] as const;
});
const linePath = chartPoints.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
const areaPath = `${linePath} L${CHART_W} ${CHART_H} L0 ${CHART_H} Z`;
const [lastX, lastY] = chartPoints[chartPoints.length - 1];

export function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full">
      <div aria-hidden className="absolute -inset-x-8 -inset-y-6 -z-10 rounded-[3rem] bg-emerald-500/[0.07] blur-3xl" />

      <div className="overflow-hidden rounded-2xl border border-border bg-card text-left shadow-xl shadow-slate-900/[0.06]">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo variant="icon" size="sm" animated={false} />
            <p className="truncate text-sm font-semibold text-foreground">Panoramica recuperi</p>
            <span className="hidden text-sm text-muted-foreground sm:inline">· ultimi 30 giorni</span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            Automazione attiva
          </span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="px-4 py-4 sm:px-5">
              <p className="truncate text-xs text-muted-foreground">{kpi.label}</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                <p className="text-lg font-semibold tracking-tight text-foreground tabular-nums sm:text-2xl">
                  {kpi.value}
                </p>
                {kpi.delta && (
                  <span className="inline-flex items-center text-xs font-medium text-emerald-700">
                    <ArrowUpRight className="size-3" aria-hidden />
                    {kpi.delta}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5">
          <div className="px-5 pt-5 pb-4 sm:col-span-3 sm:border-r sm:border-border">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-medium text-muted-foreground">Fatturato recuperato</p>
              <p className="text-xs text-muted-foreground">12 settimane</p>
            </div>
            <div className="relative mt-4 h-28">
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
                aria-hidden
              >
                <defs>
                  <linearGradient id="dashboard-mockup-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((ratio) => (
                  <line
                    key={ratio}
                    x1="0"
                    x2={CHART_W}
                    y1={CHART_H * ratio}
                    y2={CHART_H * ratio}
                    stroke="#e2e8f0"
                    strokeDasharray="3 4"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                <path d={areaPath} fill="url(#dashboard-mockup-area)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {/* Fuori dall'SVG: con preserveAspectRatio="none" un <circle> verrebbe stirato in ellisse. */}
              <span
                aria-hidden
                className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-600 bg-card"
                style={{ left: `${(lastX / CHART_W) * 100}%`, top: `${(lastY / CHART_H) * 100}%` }}
              />
            </div>
          </div>

          <div className="border-t border-border px-5 pt-5 pb-4 sm:col-span-2 sm:border-t-0">
            <p className="text-xs font-medium text-muted-foreground">Ultimi recuperi</p>
            <ul className="mt-3 divide-y divide-border">
              {RECENT.map((item) => (
                <li key={item.name} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {item.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{item.amount}/mese</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                      STATUS[item.status].className
                    )}
                  >
                    {STATUS[item.status].label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
