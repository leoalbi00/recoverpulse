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
    <div className="flex h-full flex-col justify-between rounded-xl border border-zinc-200/80 bg-white text-zinc-900 p-6 shadow-md">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            trend === "up" && "bg-emerald-100 text-emerald-700",
            trend === "down" && "bg-rose-100 text-rose-700",
            trend === "neutral" && "bg-zinc-100 text-zinc-700",
          )}
        >
          <Icon className="size-5" />
        </span>
        {delta && (
          <span
            className={cn(
              "text-xs font-medium",
              trend === "up" && "text-emerald-600",
              trend === "down" && "text-rose-600",
              trend === "neutral" && "text-zinc-600",
            )}
          >
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight text-zinc-900">
          {value}
        </p>
        <p className="mt-1 text-sm text-zinc-600">{label}</p>
      </div>
    </div>
  );
}
