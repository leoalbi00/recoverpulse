"use client";

import { useState } from "react";
import {
  Check,
  Mail,
  MessageCircle,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type {
  DunningChannel,
  DunningSettings,
  DunningStep,
} from "@/lib/dunning-settings";

const CHANNELS: {
  id: DunningChannel;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Nessuna integrazione Twilio/WhatsApp Business API implementata: il canale non invia ancora nulla. */
  available: boolean;
}[] = [
  {
    id: "whatsapp",
    label: "WhatsApp API",
    description: "Messaggio diretto con link 1-Click per aggiornare la carta.",
    icon: MessageCircle,
    available: false,
  },
  {
    id: "sms",
    label: "SMS",
    description:
      "Promemoria breve inviato se il messaggio precedente non converte.",
    icon: Smartphone,
    available: false,
  },
  {
    id: "email",
    label: "Email",
    description:
      "Sequenza di follow-up con dettaglio fattura e portale di aggiornamento pagamento.",
    icon: Mail,
    available: true,
  },
];

const STEPS: { id: DunningStep; label: string; unit: "min" | "h" }[] = [
  { id: "step1", label: "Primo sollecito", unit: "min" },
  { id: "step2", label: "Secondo sollecito", unit: "h" },
  { id: "step3", label: "Terzo sollecito", unit: "h" },
];

export function DunningSequencesPanel({
  initialSettings,
}: {
  initialSettings: DunningSettings;
}) {
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
        <h2 className="text-sm font-medium text-zinc-300">Canali attivi</h2>
        <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {CHANNELS.map((channel) => {
            const enabled = channel.available && settings.channels[channel.id];
            return (
              <div
                key={channel.id}
                className={cn(
                  "h-full rounded-xl border border-zinc-200/80 bg-white text-zinc-900 p-6 shadow-md",
                  !channel.available && "opacity-60",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-100">
                    <channel.icon className="size-5 text-emerald-700" />
                  </span>
                  <Switch
                    checked={enabled}
                    disabled={!channel.available}
                    onCheckedChange={(checked) =>
                      toggleChannel(channel.id, checked)
                    }
                    aria-label={`Attiva/disattiva canale ${channel.label}`}
                  />
                </div>
                <p className="mt-4 text-lg font-semibold text-zinc-900">
                  {channel.label}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  {channel.description}
                </p>
                <p className="mt-4 text-xs text-zinc-600">
                  {!channel.available
                    ? "Non ancora disponibile"
                    : enabled
                      ? "Canale attivo"
                      : "Canale disattivato"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-300">
              Tempi di attesa sequenza automatica
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Ogni passaggio viene inviato sui canali attivi, a partire dal
              momento del pagamento fallito.
            </p>
          </div>
          {savedAt > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-500">
              <Check className="size-3.5" />
              {saving ? "Salvataggio…" : "Salvato"}
            </span>
          )}
        </div>

        <div className="mt-3 rounded-xl border border-zinc-200/80 bg-white text-zinc-900 p-6 shadow-md">
          <div className="divide-y divide-zinc-200">
            {STEPS.map((step, index) => {
              const minutes = settings.timing[step.id];
              const displayValue = step.unit === "h" ? minutes / 60 : minutes;
              return (
                <div
                  key={step.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {step.label}
                    </p>
                    <p className="text-xs text-zinc-600">
                      Passaggio {index + 1} della sequenza
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-zinc-600">
                    T+
                    <input
                      type="number"
                      min={1}
                      value={displayValue}
                      onChange={(event) =>
                        updateTiming(
                          step.id,
                          Number(event.target.value),
                          step.unit,
                        )
                      }
                      className="h-9 w-20 rounded-lg border border-zinc-200/80 bg-white px-2 text-center text-sm text-zinc-900 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
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
