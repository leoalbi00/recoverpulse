import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
};

export function StatCard({ icon: Icon, label, value, delta, trend = "neutral" }: StatCardProps) {
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 shadow-sm hover:shadow-md dark:shadow-xl dark:shadow-black/20 dark:backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <Icon className="size-5 text-emerald-500" />
        </span>
        {delta && (
          <span
            className={cn(
              "text-xs font-medium",
              trend === "up" && "text-emerald-500",
              trend === "down" && "text-rose-500",
              trend === "neutral" && "text-zinc-500"
            )}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {value}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      </div>
    </div>
  );
}
