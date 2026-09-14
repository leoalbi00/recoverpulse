"use client";

import { useState } from "react";
import { Check, CheckCircle2, Copy, Loader2, ShieldCheck, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard non disponibile: nessun feedback, il valore resta comunque selezionabile a mano.
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
          {copied ? "Copiato" : "Copia URL"}
        </Button>
      </div>
    </div>
  );
}

export function PaypalSettingsPanel({
  initialConnected,
  initialClientId,
  initialWebhookId,
  webhookUrl,
}: {
  initialConnected: boolean;
  initialClientId: string;
  initialWebhookId: string;
  webhookUrl: string;
}) {
  const [connected, setConnected] = useState(initialConnected);
  const [clientId, setClientId] = useState(initialClientId);
  const [clientSecret, setClientSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [webhookId, setWebhookId] = useState(initialWebhookId);
  const [savingWebhookId, setSavingWebhookId] = useState(false);
  const [webhookIdSaved, setWebhookIdSaved] = useState(false);

  async function handleConnect(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/dashboard/paypal-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Collegamento a PayPal non riuscito.");
      setConnected(true);
      setClientSecret("");
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : "Collegamento a PayPal non riuscito.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWebhookId() {
    setSavingWebhookId(true);
    setWebhookIdSaved(false);
    try {
      const response = await fetch("/api/dashboard/paypal-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId }),
      });
      if (!response.ok) throw new Error();
      setWebhookIdSaved(true);
      setTimeout(() => setWebhookIdSaved(false), 2000);
    } catch {
      // Nessun blocco della UI: il campo resta modificabile per un nuovo tentativo.
    } finally {
      setSavingWebhookId(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600">
          Incolla Client ID e Secret Key della tua app PayPal REST (Developer Dashboard → App PayPal &amp; credenziali) per
          collegare in automatico il recupero degli abbonamenti PayPal.
        </p>
        {connected && (
          <Badge className="h-auto shrink-0 items-center gap-1 bg-emerald-100 px-2.5 py-1 text-emerald-800">
            <ShieldCheck className="size-3.5" />
            Collegato
          </Badge>
        )}
      </div>

      <form onSubmit={handleConnect} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="paypal-client-id" className="text-sm font-medium text-zinc-700">
            Client ID
          </label>
          <input
            id="paypal-client-id"
            type="text"
            required
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            placeholder="AeA1QIZXiflr1_-r-pd..."
            className="h-10 w-full rounded-lg border border-zinc-200/80 bg-white px-3 font-mono text-xs text-zinc-900 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="paypal-client-secret" className="text-sm font-medium text-zinc-700">
            Secret Key
          </label>
          <input
            id="paypal-client-secret"
            type="password"
            required={!connected}
            value={clientSecret}
            onChange={(event) => setClientSecret(event.target.value)}
            placeholder={connected ? "•••••••••••••••• (invariata se lasciata vuota)" : "EGnHDxD_qRPdaLdZz8i..."}
            className="h-10 w-full rounded-lg border border-zinc-200/80 bg-white px-3 font-mono text-xs text-zinc-900 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-50 px-3 py-2.5 text-sm text-rose-600">
            <XCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {connected ? "Aggiorna credenziali" : "Collega Account PayPal"}
          </Button>
        </div>
      </form>

      <Accordion className="overflow-hidden rounded-lg border border-zinc-200/80">
        <AccordionItem value="advanced" className="border-b-0 bg-zinc-50 px-4">
          <AccordionTrigger className="py-3 text-sm font-medium text-zinc-800">
            Configurazione Avanzata
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-xs text-zinc-600">
              Registra questo URL come Webhook nel tuo PayPal Developer Dashboard, sottoscrivendo gli eventi{" "}
              <code className="rounded bg-zinc-200 px-1 py-0.5">BILLING.SUBSCRIPTION.PAYMENT.FAILED</code> e{" "}
              <code className="rounded bg-zinc-200 px-1 py-0.5">BILLING.SUBSCRIPTION.SUSPENDED</code>. PayPal ti
              assegnerà un Webhook ID: incollalo qui sotto per completare la verifica delle firme.
            </p>
            <div className="mt-4">
              <CopyField label="URL Webhook" value={webhookUrl} />
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="paypal-webhook-id" className="text-sm font-medium text-zinc-700">
                Webhook ID
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="paypal-webhook-id"
                  type="text"
                  value={webhookId}
                  onChange={(event) => setWebhookId(event.target.value)}
                  placeholder="5GP028193K746392H"
                  className="h-10 w-full rounded-lg border border-zinc-200/80 bg-white px-3 font-mono text-xs text-zinc-900 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={savingWebhookId}
                  className="shrink-0 border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                  onClick={handleSaveWebhookId}
                >
                  {savingWebhookId ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : webhookIdSaved ? (
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                  ) : null}
                  {webhookIdSaved ? "Salvato" : "Salva"}
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
