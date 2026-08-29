import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
};

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  trend = "neutral",
}: StatCardProps) {
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md">
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
              trend === "neutral" && "text-slate-500",
            )}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
