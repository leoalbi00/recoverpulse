"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function SubscriptionCard({ hasSubscription }: { hasSubscription: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManage() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/billing-portal", { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? "Impossibile aprire il portale di fatturazione.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossibile aprire il portale di fatturazione.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 shadow-sm hover:shadow-md dark:shadow-xl dark:shadow-black/20 dark:backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <CreditCard className="size-4 text-emerald-500" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Abbonamento RecoverPulse</p>
              {hasSubscription && (
                <Badge className="h-auto bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Attivo</Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              {hasSubscription
                ? "Gestisci piano, metodo di pagamento e fatture dal portale Stripe."
                : "Nessun abbonamento attivo: scegli un piano qui sotto per iniziare."}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" disabled={loading} onClick={handleManage} className="shrink-0">
          {loading ? "Apertura…" : "Gestisci Abbonamento"}
        </Button>
      </div>
      {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}
    </div>
  );
}
