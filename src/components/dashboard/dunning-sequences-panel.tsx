"use client";

import { useState } from "react";
import { Check, Mail, MessageCircle, Smartphone, type LucideIcon } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { DunningChannel, DunningSettings } from "@/lib/dunning-settings";

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

  return (
    <div className="mt-8 space-y-8">
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-300">Canali attivi</h2>
          {savedAt > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-500">
              <Check className="size-3.5" />
              {saving ? "Salvataggio…" : "Salvato"}
            </span>
          )}
        </div>
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
    </div>
  );
}
