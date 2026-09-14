"use client";

import { useState } from "react";
import { Check, Copy, Landmark, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

const EXAMPLE_PAYLOAD = `{
  "customer_email": "cliente@esempio.it",
  "amount": 15000,
  "currency": "EUR",
  "mandate_ref": "MAND-123",
  "failure_reason": "Fondi insufficienti",
  "failure_code": "AC01",
  "iban_last4": "1234"
}`;

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard non disponibile (es. contesto non sicuro): nessun feedback,
      // il valore resta comunque selezionabile a mano dal campo readonly.
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={value}
          onFocus={(event) => event.target.select()}
          className="h-10 w-full rounded-lg border border-zinc-200/80 bg-zinc-100 px-3 font-mono text-xs text-zinc-900 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          onClick={handleCopy}
        >
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          {copied ? "Copiato" : "Copia"}
        </Button>
      </div>
    </div>
  );
}

export function SddWebhookSettingsPanel({
  initialApiKey,
  webhookUrl,
}: {
  initialApiKey: string;
  webhookUrl: string;
}) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    if (
      !window.confirm(
        "Rigenerando la API Key, quella attuale smetterà di funzionare immediatamente: dovrai aggiornarla nel tuo gestionale/CRM esterno. Continuare?"
      )
    ) {
      return;
    }

    setError(null);
    setRegenerating(true);
    try {
      const response = await fetch("/api/dashboard/merchant-api-key/regenerate", { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Errore durante la rigenerazione.");
      setApiKey(data.apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante la rigenerazione.");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white text-zinc-900 p-6 shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
          <Landmark className="size-4 text-emerald-700" />
        </span>
        <div>
          <p className="text-sm font-medium text-zinc-900">Webhook Universale SDD / SEPA</p>
          <p className="mt-0.5 text-xs text-zinc-600">
            Collega il tuo gestionale/CRM esterno per notificare in automatico gli insoluti SEPA Direct Debit.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        <CopyField label="URL Webhook" value={webhookUrl} />
        <CopyField label="API Key" value={apiKey} />

        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={regenerating}
            className="border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
            onClick={handleRegenerate}
          >
            {regenerating ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Rigenera API Key
          </Button>
          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
        </div>

        <div className="rounded-lg border border-zinc-200/80 bg-zinc-100 p-4">
          <p className="text-xs font-medium text-zinc-600 uppercase tracking-wide">Esempio payload</p>
          <p className="mt-1.5 text-xs text-zinc-600">
            Invia una richiesta <code className="rounded bg-zinc-200 px-1 py-0.5">POST</code> a questo URL con
            l&apos;header <code className="rounded bg-zinc-200 px-1 py-0.5">X-Api-Key</code> impostato sulla tua
            chiave, e questo corpo JSON per ogni insoluto:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-zinc-900 p-3 text-[11px] leading-relaxed text-zinc-100">
            {EXAMPLE_PAYLOAD}
          </pre>
          <p className="mt-3 text-xs text-zinc-600">
            OmniRev registra l&apos;insoluto e avvia subito, in automatico, la sequenza di email di dunning
            dedicata SDD verso <code className="rounded bg-zinc-200 px-1 py-0.5">customer_email</code>, senza alcun
            intervento manuale.
          </p>
        </div>
      </div>
    </div>
  );
}
