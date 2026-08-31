"use client";

import { useState } from "react";
import { CreditCard, ExternalLink, Loader2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type StripeConnectCardProps = {
  connected: boolean;
  stripeAccountId: string | null;
  livemode: boolean | null;
};

function maskAccountId(id: string): string {
  return id.length <= 4 ? id : `acct_••••${id.slice(-4)}`;
}

/**
 * Sostituisce l'inserimento manuale di Stripe Publishable/Secret Key
 * (rimosse da src/components/dashboard/integration-keys-panel.tsx) con il
 * flusso OAuth Stripe Connect: src/app/api/stripe/connect/authorize/route.ts
 * avvia l'autorizzazione, .../callback/route.ts la completa.
 */
export function StripeConnectCard({ connected, stripeAccountId, livemode }: StripeConnectCardProps) {
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const response = await fetch("/api/stripe/connect", { method: "DELETE" });
      if (response.ok) window.location.reload();
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white text-zinc-900 p-6 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
            <CreditCard className="size-4 text-emerald-700" />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-900">Account Stripe</p>
            <p className="mt-0.5 text-xs text-zinc-600">
              {connected
                ? "Collegato: i pagamenti falliti sul tuo account vengono monitorati e recuperati automaticamente."
                : "Collega il tuo account Stripe in 1-click per iniziare a recuperare pagamenti falliti, senza incollare chiavi API o configurare webhook a mano."}
            </p>
          </div>
        </div>

        {connected ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge className="h-auto items-center gap-1 bg-emerald-100 px-2.5 py-1 text-emerald-800">
              <ShieldCheck className="size-3.5" />
              Connesso{stripeAccountId ? ` · ${maskAccountId(stripeAccountId)}` : ""}
              {livemode === false ? " (test)" : ""}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disconnecting}
              onClick={handleDisconnect}
              className="border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
            >
              {disconnecting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Disconnetti
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            render={<a href="/api/stripe/connect/authorize" />}
            className="shrink-0 gap-1.5"
          >
            Connetti con Stripe
            <ExternalLink className="size-3.5" data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  );
}
