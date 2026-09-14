"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Copy, Loader2, RefreshCw, Send, ShieldCheck, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

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
          {copied ? "Copiato" : "Copia URL"}
        </Button>
      </div>
    </div>
  );
}

/** Notifica transitoria in basso a destra, stile "toast": nessuna libreria
 * dedicata nel progetto, un'implementazione locale minimale è sufficiente
 * per l'unico pulsante che la usa. */
function Toast({ message, tone, onDismiss }: { message: string; tone: "success" | "error"; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
        tone === "success"
          ? "border-emerald-500/30 bg-emerald-600 text-white"
          : "border-rose-500/30 bg-rose-600 text-white"
      )}
    >
      {tone === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
      {message}
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

  const [sendingTest, setSendingTest] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

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

  // Invia un vero insoluto di prova al webhook (stesso endpoint usato da un
  // gestionale/CRM esterno reale): a differenza della documentazione API qui
  // sotto, che è solo testo da copiare, questo pulsante esegue davvero la
  // chiamata con la API Key corrente, così il merchant può verificare
  // l'integrazione end-to-end senza uscire dalla dashboard. Genera una
  // fattura di test reale (visibile in /dashboard/recuperi) e avvia la
  // sequenza di dunning verso l'email di prova.
  //
  // Chiamata same-origin (percorso relativo), non all'URL assoluto mostrato
  // in `webhookUrl` (sempre il dominio di produzione, vedi getAppBaseUrl):
  // da dashboard servite altrove (es. `next dev` in locale) una fetch
  // cross-origin verso quell'URL verrebbe bloccata dal CORS del browser,
  // dato che l'endpoint non espone Access-Control-Allow-Origin per chiamate
  // browser esterne — solo per POST server-to-server come quelle di un
  // gestionale reale.
  async function handleSendTestEvent() {
    setSendingTest(true);
    try {
      const response = await fetch("/api/v1/webhooks/sdd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
        body: JSON.stringify({
          customer_email: "test@example.com",
          amount: 4900,
          currency: "EUR",
          mandate_ref: `TEST-${Date.now()}`,
          failure_reason: "Evento di test inviato dalla dashboard OmniRev",
          failure_code: "AC01",
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Invio dell'insoluto di prova non riuscito.");
      setToast({ message: "Insoluto di prova inviato con successo!", tone: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Invio dell'insoluto di prova non riuscito.",
        tone: "error",
      });
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600">
          Collega il tuo gestionale/CRM esterno per notificare in automatico gli insoluti SEPA Direct Debit.
        </p>
        <Badge className="h-auto shrink-0 items-center gap-1 bg-emerald-100 px-2.5 py-1 text-emerald-800">
          <ShieldCheck className="size-3.5" />
          Pronto per l&apos;uso
        </Badge>
      </div>

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

      <Accordion className="overflow-hidden rounded-lg border border-zinc-200/80">
        <AccordionItem value="docs" className="border-b-0 bg-zinc-50 px-4">
          <AccordionTrigger className="py-3 text-sm font-medium text-zinc-800">
            Mostra documentazione API
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-xs text-zinc-600">
              Invia una richiesta <code className="rounded bg-zinc-200 px-1 py-0.5">POST</code> a questo URL con
              l&apos;header <code className="rounded bg-zinc-200 px-1 py-0.5">X-Api-Key</code> impostato sulla tua
              chiave, e questo corpo JSON per ogni insoluto:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-md bg-zinc-900 p-3 text-[11px] leading-relaxed text-zinc-100">
              {EXAMPLE_PAYLOAD}
            </pre>
            <p className="mt-3 text-xs text-zinc-600">
              OmniRev registra l&apos;insoluto e avvia subito, in automatico, la sequenza di email di dunning
              dedicata SDD verso <code className="rounded bg-zinc-200 px-1 py-0.5">customer_email</code>, senza
              alcun intervento manuale.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="border-t border-zinc-200/80 pt-5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={sendingTest}
          className="border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          onClick={handleSendTestEvent}
        >
          {sendingTest ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          Invia Insoluto di Prova
        </Button>
        <p className="mt-1.5 text-xs text-zinc-500">
          Simula l&apos;intero flusso: crea una fattura di test reale (visibile in Recuperi) e avvia il dunning
          verso <code className="rounded bg-zinc-100 px-1 py-0.5">test@example.com</code>.
        </p>
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </div>
  );
}
