"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RecoveryChartPoint } from "@/lib/transactions";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-zinc-200/80 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-zinc-900">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.name}
          className="flex items-center gap-1.5 text-zinc-700"
        >
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}:{" "}
          <span className="font-medium text-zinc-900">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

// Recharts disegna su SVG: gli assi/la griglia hanno bisogno di un colore
// reale (non di una classe Tailwind). Il grafico vive solo nella dashboard,
// sempre in tema chiaro, quindi i colori sono fissi.
const AXIS_STROKE = "rgba(15,23,42,0.35)";
const GRID_STROKE = "rgba(15,23,42,0.08)";
const CURSOR_STROKE = "rgba(15,23,42,0.15)";

export function RecoveryChart({ data }: { data: RecoveryChartPoint[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="recoveredGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={GRID_STROKE}
            vertical={false}
          />
          <XAxis
            dataKey="day"
            stroke={AXIS_STROKE}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval={1}
          />
          <YAxis
            stroke={AXIS_STROKE}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `$${value}`}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: CURSOR_STROKE }}
          />
          <Area
            type="monotone"
            dataKey="recovered"
            name="Fatturato Recuperato ($)"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#recoveredGradient)"
          />
          <Area
            type="monotone"
            dataKey="failed"
            name="Pagamenti Falliti ($)"
            stroke="#f43f5e"
            strokeWidth={2}
            fill="url(#failedGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
