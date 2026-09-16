"use client";

import { useState } from "react";
import { Banknote, ExternalLink, Loader2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type GoCardlessConnectCardProps = {
  connected: boolean;
  organisationId: string | null;
  organisationName: string | null;
};

function maskOrganisationId(id: string): string {
  return id.length <= 4 ? id : `••••${id.slice(-4)}`;
}

/**
 * Flusso OAuth2 GoCardless Partner App per il collegamento 1-click SEPA
 * Direct Debit, alternativo al webhook universale gestito da
 * SddWebhookSettingsPanel per chi usa un gestionale/CRM diverso da
 * GoCardless. Vedi src/app/api/gocardless/connect/{authorize,callback}/route.ts.
 */
export function GoCardlessConnectCard({ connected, organisationId, organisationName }: GoCardlessConnectCardProps) {
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const response = await fetch("/api/gocardless/connect", { method: "DELETE" });
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
            <Banknote className="size-4 text-emerald-700" />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-900">Account GoCardless</p>
            <p className="mt-0.5 text-xs text-zinc-600">
              {connected
                ? `Collegato${organisationName ? ` · ${organisationName}` : ""}: gli addebiti SEPA falliti sul tuo account GoCardless vengono intercettati automaticamente.`
                : "Collega il tuo account GoCardless in 1-click via OAuth per recuperare in automatico gli addebiti SEPA Direct Debit falliti, senza copiare API key o configurare webhook a mano."}
            </p>
          </div>
        </div>

        {connected ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge className="h-auto items-center gap-1 bg-emerald-100 px-2.5 py-1 text-emerald-800">
              <ShieldCheck className="size-3.5" />
              Connesso{organisationId ? ` · ${maskOrganisationId(organisationId)}` : ""}
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
            render={<a href="/api/gocardless/connect/authorize" />}
            className="shrink-0 gap-1.5"
          >
            Connetti SEPA / GoCardless (1-Click)
            <ExternalLink className="size-3.5" data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  );
}
