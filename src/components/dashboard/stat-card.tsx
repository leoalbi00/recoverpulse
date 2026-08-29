import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
};

export function StatCard({ icon: Icon, label, value, delta }: StatCardProps) {
  // Nessuno stato di caricamento qui: StatCard è un componente puramente
  // presentazionale, renderizzato lato server dentro pagine che già
  // attendono i dati (await listTransactions() ecc.) prima del return — non
  // esiste un ramo "isLoading"/Skeleton che possa bloccarlo su un
  // placeholder. Il fallback sotto copre solo il caso limite di value/label
  // vuoti in arrivo dal chiamante.
  const displayValue = value || "€0,00";
  const displayLabel = label || "—";

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-zinc-100 p-2 text-zinc-700">
          <Icon className="size-5" />
        </span>
        {delta && <span className="text-xs text-zinc-500">{delta}</span>}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-zinc-900">{displayValue}</p>
        <p className="text-sm font-medium text-zinc-600">{displayLabel}</p>
      </div>
    </div>
  );
}
