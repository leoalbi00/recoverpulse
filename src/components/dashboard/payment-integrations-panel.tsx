"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { StripeConnectCard } from "@/components/dashboard/stripe-connect-card";
import { PaypalSettingsPanel } from "@/components/dashboard/paypal-settings-panel";
import { SddWebhookSettingsPanel } from "@/components/dashboard/sdd-webhook-settings-panel";

type ProviderTabId = "stripe" | "paypal" | "sepa";

const TABS: { id: ProviderTabId; label: string }[] = [
  { id: "stripe", label: "Stripe Connect" },
  { id: "paypal", label: "PayPal Subscriptions" },
  { id: "sepa", label: "SEPA Direct Debit" },
];

/**
 * Vista unificata dei tre gateway di pagamento supportati per il recupero
 * automatico degli insoluti (Stripe, PayPal, SDD/SEPA): sostituisce le due
 * sezioni separate "Account Stripe" e "Integrazione SDD/SEPA" che c'erano
 * prima in /dashboard/impostazioni con un'unica scheda a tab, stesso
 * principio del selettore canale in Sequenze Dunning
 * (src/components/dashboard/dunning-channel-tabs.tsx) applicato ai gateway
 * di pagamento invece che ai canali di notifica.
 */
export function PaymentIntegrationsPanel({
  stripeConnected,
  stripeAccountId,
  stripeLivemode,
  paypalConnected,
  paypalClientId,
  paypalWebhookId,
  paypalWebhookUrl,
  sddApiKey,
  sddWebhookUrl,
}: {
  stripeConnected: boolean;
  stripeAccountId: string | null;
  stripeLivemode: boolean | null;
  paypalConnected: boolean;
  paypalClientId: string;
  paypalWebhookId: string;
  paypalWebhookUrl: string;
  sddApiKey: string;
  sddWebhookUrl: string;
}) {
  const [activeTab, setActiveTab] = useState<ProviderTabId>("stripe");

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white text-zinc-900 p-6 shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
          <Wallet className="size-4 text-emerald-700" />
        </span>
        <div>
          <p className="text-sm font-medium text-zinc-900">Metodi di Pagamento</p>
          <p className="mt-0.5 text-xs text-zinc-600">
            Collega Stripe, PayPal e SDD/SEPA: OmniRev recupera automaticamente gli insoluti di ciascun gateway.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-1 border-b border-zinc-200" role="tablist">
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
                "relative px-3.5 py-2.5 text-sm font-medium transition-colors",
                isActive ? "text-emerald-600" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-emerald-500" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6" role="tabpanel">
        {activeTab === "stripe" && (
          <StripeConnectCard connected={stripeConnected} stripeAccountId={stripeAccountId} livemode={stripeLivemode} />
        )}

        {activeTab === "paypal" && (
          <PaypalSettingsPanel
            initialConnected={paypalConnected}
            initialClientId={paypalClientId}
            initialWebhookId={paypalWebhookId}
            webhookUrl={paypalWebhookUrl}
          />
        )}

        {activeTab === "sepa" && <SddWebhookSettingsPanel initialApiKey={sddApiKey} webhookUrl={sddWebhookUrl} />}
      </div>
    </div>
  );
}
