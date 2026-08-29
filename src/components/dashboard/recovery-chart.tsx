"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
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
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: <span className="font-medium text-zinc-900 dark:text-zinc-100">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function RecoveryChart({ data }: { data: RecoveryChartPoint[] }) {
  // Recharts disegna su SVG: gli assi/la griglia hanno bisogno di un colore
  // reale (non di una classe Tailwind dark:), quindi seguiamo il tema attivo
  // via next-themes. Prima del mount usiamo i valori dark (defaultTheme
  // dell'app) per evitare un mismatch di idratazione.
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isLight = mounted && resolvedTheme === "light";
  const axisStroke = isLight ? "rgba(24,24,27,0.35)" : "rgba(255,255,255,0.3)";
  const gridStroke = isLight ? "rgba(24,24,27,0.08)" : "rgba(255,255,255,0.06)";
  const cursorStroke = isLight ? "rgba(24,24,27,0.15)" : "rgba(255,255,255,0.15)";

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="day"
            stroke={axisStroke}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval={1}
          />
          <YAxis
            stroke={axisStroke}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `$${value}`}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: cursorStroke }} />
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
