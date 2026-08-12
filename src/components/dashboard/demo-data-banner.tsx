"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DemoDataBanner() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/demo-data", { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Errore durante la generazione dei dati demo.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante la generazione dei dati demo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8 flex flex-col gap-3 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <Sparkles className="size-4 text-emerald-500" />
        </span>
        <div>
          <p className="text-sm font-medium text-zinc-100">Modalità sviluppo</p>
          <p className="mt-0.5 text-sm text-zinc-400">
            Popola dashboard, tabella e grafico con 8 transazioni simulate per vedere subito la UI in azione.
          </p>
          {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={handleGenerate}
        className="shrink-0"
      >
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        {loading ? "Generazione…" : "Genera Dati Demo"}
      </Button>
    </div>
  );
}
