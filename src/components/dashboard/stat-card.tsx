import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
};

export function StatCard({ icon: Icon, label, value, delta }: StatCardProps) {
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-zinc-100 p-2 text-zinc-700">
          <Icon className="size-5" />
        </span>
        {delta && <span className="text-xs text-zinc-500">{delta}</span>}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-zinc-900">{value}</p>
        <p className="text-sm font-medium text-zinc-600">{label}</p>
      </div>
    </div>
  );
}
