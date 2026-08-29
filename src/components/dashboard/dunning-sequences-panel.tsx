"use client";

import { useState } from "react";
import { Check, Mail, MessageCircle, Smartphone, type LucideIcon } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import type { DunningChannel, DunningSettings, DunningStep } from "@/lib/dunning-settings";

const CHANNELS: { id: DunningChannel; label: string; description: string; icon: LucideIcon }[] = [
  {
    id: "whatsapp",
    label: "WhatsApp API",
    description: "Messaggio diretto con link 1-Click per aggiornare la carta.",
    icon: MessageCircle,
  },
  {
    id: "sms",
    label: "SMS",
    description: "Promemoria breve inviato se il messaggio precedente non converte.",
    icon: Smartphone,
  },
  {
    id: "email",
    label: "Email",
    description: "Sequenza di follow-up con dettaglio fattura e portale di aggiornamento pagamento.",
    icon: Mail,
  },
];

const STEPS: { id: DunningStep; label: string; unit: "min" | "h" }[] = [
  { id: "step1", label: "Primo sollecito", unit: "min" },
  { id: "step2", label: "Secondo sollecito", unit: "h" },
  { id: "step3", label: "Terzo sollecito", unit: "h" },
];

export function DunningSequencesPanel({ initialSettings }: { initialSettings: DunningSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  async function persist(next: DunningSettings) {
    setSettings(next);
    setSaving(true);
    try {
      await fetch("/api/dashboard/dunning-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  function toggleChannel(id: DunningChannel, enabled: boolean) {
    persist({ ...settings, channels: { ...settings.channels, [id]: enabled } });
  }

  function updateTiming(id: DunningStep, value: number, unit: "min" | "h") {
    if (!Number.isFinite(value) || value <= 0) return;
    const minutes = unit === "h" ? value * 60 : value;
    persist({ ...settings, timing: { ...settings.timing, [id]: minutes } });
  }

  return (
    <div className="mt-8 space-y-8">
      <section>
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Canali attivi</h2>
        <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {CHANNELS.map((channel) => {
            const enabled = settings.channels[channel.id];
            return (
              <div
                key={channel.id}
                className="h-full rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 shadow-sm hover:shadow-md dark:shadow-xl dark:shadow-black/20 dark:backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <channel.icon className="size-5 text-emerald-500" />
                  </span>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => toggleChannel(channel.id, checked)}
                    aria-label={`Attiva/disattiva canale ${channel.label}`}
                  />
                </div>
                <p className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{channel.label}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{channel.description}</p>
                <p className="mt-4 text-xs text-zinc-500">{enabled ? "Canale attivo" : "Canale disattivato"}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tempi di attesa sequenza automatica</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Ogni passaggio viene inviato sui canali attivi, a partire dal momento del pagamento fallito.
            </p>
          </div>
          {savedAt > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-600 dark:text-emerald-500">
              <Check className="size-3.5" />
              {saving ? "Salvataggio…" : "Salvato"}
            </span>
          )}
        </div>

        <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 shadow-sm hover:shadow-md dark:shadow-xl dark:shadow-black/20 dark:backdrop-blur-sm">
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
            {STEPS.map((step, index) => {
              const minutes = settings.timing[step.id];
              const displayValue = step.unit === "h" ? minutes / 60 : minutes;
              return (
                <div
                  key={step.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{step.label}</p>
                    <p className="text-xs text-zinc-500">Passaggio {index + 1} della sequenza</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    T+
                    <input
                      type="number"
                      min={1}
                      value={displayValue}
                      onChange={(event) => updateTiming(step.id, Number(event.target.value), step.unit)}
                      className="h-9 w-20 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-2 text-center text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    {step.unit}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
