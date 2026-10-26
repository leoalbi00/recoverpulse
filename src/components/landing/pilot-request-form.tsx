"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PilotRequestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [estimatedMrr, setEstimatedMrr] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, deve restare vuoto
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/pilot-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, estimatedMrr, message, website }),
      }).catch(() => {
        // TypeError di rete ("Failed to fetch"): non mostrarlo all'utente.
        throw new Error("Connessione non riuscita. Controlla la rete e riprova.");
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? "Errore durante l'invio.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'invio.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-600/20">
          <CheckCircle2 className="size-7 text-emerald-700" />
        </span>
        <p className="text-lg font-semibold text-foreground">Richiesta inviata</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Grazie! Il nostro team ti contatterà entro 1 giorno lavorativo per organizzare l&apos;integrazione pilota.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pilot-name" className="text-sm font-medium text-slate-700">
            Nome e cognome
          </label>
          <input
            id="pilot-name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Mario Rossi"
            className="h-10 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pilot-email" className="text-sm font-medium text-slate-700">
            Email aziendale
          </label>
          <input
            id="pilot-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="mario@tuaazienda.com"
            className="h-10 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pilot-company" className="text-sm font-medium text-slate-700">
            Azienda
          </label>
          <input
            id="pilot-company"
            type="text"
            required
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Nome della tua azienda"
            className="h-10 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pilot-mrr" className="text-sm font-medium text-slate-700">
            MRR mensile stimato <span className="text-muted-foreground">(opzionale)</span>
          </label>
          <input
            id="pilot-mrr"
            type="text"
            value={estimatedMrr}
            onChange={(event) => setEstimatedMrr(event.target.value)}
            placeholder="es. $20.000"
            className="h-10 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pilot-message" className="text-sm font-medium text-slate-700">
          Messaggio <span className="text-muted-foreground">(opzionale)</span>
        </label>
        <textarea
          id="pilot-message"
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Raccontaci del tuo stack Stripe e cosa vorresti testare nel pilota."
          className="resize-none rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Honeypot anti-spam: nascosto ai visitatori reali via CSS, non con `hidden`/`display:none`
          (alcuni bot li ignorano), e fuori dal tab order. */}
      <div className="h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
        <label htmlFor="pilot-website">Sito web</label>
        <input
          id="pilot-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="h-11 gap-2 self-start rounded-full px-6 text-sm font-semibold shadow-lg shadow-slate-900/10"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {submitting ? "Invio in corso…" : "Richiedi Integrazione Pilota"}
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Useremo i dati inseriti solo per rispondere alla tua richiesta e organizzare l&apos;eventuale
        integrazione pilota (art. 6, par. 1, lett. b, GDPR), senza invii di marketing. Dettagli nella{" "}
        <a href="/privacy#dati-raccolti" target="_blank" className="text-foreground underline-offset-2 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
