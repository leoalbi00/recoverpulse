"use client";

import { useState } from "react";
import { Mail, MessageCircle, Smartphone, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DunningTemplatesManager } from "@/components/dashboard/dunning-templates-manager";
import type { DunningTemplatesSettings } from "@/lib/dunning-templates";

type ChannelTabId = "email" | "sms" | "whatsapp";

const TABS: { id: ChannelTabId; label: string; icon: LucideIcon; comingSoon: boolean }[] = [
  { id: "email", label: "Email", icon: Mail, comingSoon: false },
  { id: "sms", label: "SMS", icon: Smartphone, comingSoon: true },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, comingSoon: true },
];

const COMING_SOON_COPY: Record<"sms" | "whatsapp", { title: string; description: string; icon: LucideIcon }> = {
  sms: {
    title: "SMS",
    description: "Promemoria breve via SMS, inviato se l'email precedente non converte.",
    icon: Smartphone,
  },
  whatsapp: {
    title: "WhatsApp API",
    description: "Messaggio diretto su WhatsApp con link 1-Click per aggiornare la carta.",
    icon: MessageCircle,
  },
};

/**
 * Navigazione a tab per i canali dunning: Email è l'unico canale realmente
 * implementato (vedi src/lib/dunning.ts), SMS e WhatsApp restano tab di
 * anteprima disabilitate finché non esiste un'integrazione reale (Twilio /
 * WhatsApp Business API). L'inserimento futuro di quei canali resta
 * confinato qui dentro: niente nuove pagine o voci in sidebar, solo un nuovo
 * tab (vedi src/components/dashboard/sidebar.tsx, che punta un'unica voce
 * "Sequenze Dunning" a questa pagina).
 */
export function DunningChannelTabs({
  initialTemplatesSettings,
  initialChannelEmailEnabled,
}: {
  initialTemplatesSettings: DunningTemplatesSettings;
  initialChannelEmailEnabled: boolean;
}) {
  const [activeTab, setActiveTab] = useState<ChannelTabId>("email");

  return (
    <div className="mt-8">
      <div className="flex items-center gap-1 border-b border-zinc-800" role="tablist">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                isActive ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-100",
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
              {tab.comingSoon && (
                <Badge
                  variant="outline"
                  className="border-amber-400/30 bg-amber-400/10 text-amber-300"
                >
                  In arrivo
                </Badge>
              )}
              {isActive && (
                <span
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-emerald-400"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6" role="tabpanel">
        {activeTab === "email" ? (
          <DunningTemplatesManager
            initialSettings={initialTemplatesSettings}
            initialChannelEnabled={initialChannelEmailEnabled}
          />
        ) : (
          <ChannelComingSoon channel={activeTab} />
        )}
      </div>
    </div>
  );
}

function ChannelComingSoon({ channel }: { channel: "sms" | "whatsapp" }) {
  const copy = COMING_SOON_COPY[channel];
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white text-zinc-900 p-10 text-center shadow-md">
      <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-zinc-100">
        <copy.icon className="size-6 text-zinc-500" />
      </span>
      <p className="mt-4 text-lg font-semibold text-zinc-900">{copy.title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-zinc-600">{copy.description}</p>
      <Badge
        variant="outline"
        className="mt-4 border-amber-400/30 bg-amber-50 text-amber-700"
      >
        In arrivo
      </Badge>
      <p className="mx-auto mt-5 max-w-sm text-xs text-zinc-500">
        Nel frattempo la sequenza di solleciti via Email resta attiva nel tab
        &quot;Email&quot;.
      </p>
    </div>
  );
}
