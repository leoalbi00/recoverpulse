"use client";

import { useState, type FormEvent } from "react";
import { Check, KeyRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IntegrationSettings } from "@/lib/integration-settings";

type FieldStatus = { configured: boolean; masked: string };
type KeysStatus = Record<keyof IntegrationSettings, FieldStatus>;

const FIELDS: { id: keyof IntegrationSettings; label: string; helper: string }[] = [
  {
    id: "stripeSecretKey",
    label: "Stripe Secret Key",
    helper: "Usata per leggere fatture ed eventi dal tuo account Stripe.",
  },
  {
    id: "resendApiKey",
    label: "Resend API Key",
    helper: "Usata per inviare le email della sequenza dunning.",
  },
  {
    id: "twilioAccountSid",
    label: "Twilio Account SID",
    helper: "Usato per inviare i solleciti via SMS e WhatsApp Business.",
  },
  {
    id: "twilioAuthToken",
    label: "Twilio Auth Token",
    helper: "Token di autenticazione associato al tuo Account SID Twilio.",
  },
];

export function IntegrationKeysPanel({ initialStatus }: { initialStatus: KeysStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [values, setValues] = useState<Record<keyof IntegrationSettings, string>>({
    stripeSecretKey: "",
    resendApiKey: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const payload = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value.trim().length > 0)
    );

    try {
      const response = await fetch("/api/dashboard/integration-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Errore durante il salvataggio.");

      const refreshed = await fetch("/api/dashboard/integration-settings");
      setStatus(await refreshed.json());
      setValues({ stripeSecretKey: "", resendApiKey: "", twilioAccountSid: "", twilioAuthToken: "" });
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <KeyRound className="size-4 text-emerald-500" />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-100">Chiavi API</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Le tue credenziali restano private e vengono usate solo per il tuo account.
            </p>
          </div>
        </div>
        {savedAt > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-500">
            <Check className="size-3.5" />
            Salvato
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={field.id} className="text-sm font-medium text-zinc-300">
                {field.label}
              </label>
              {status[field.id].configured && (
                <Badge variant="outline" className="h-auto border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-500">
                  Configurata
                </Badge>
              )}
            </div>
            <input
              id={field.id}
              type="password"
              autoComplete="off"
              value={values[field.id]}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, [field.id]: event.target.value }))
              }
              placeholder={status[field.id].configured ? status[field.id].masked : "Non configurata"}
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="text-xs text-zinc-500">{field.helper}</p>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-xs text-rose-500">{error}</p>}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-zinc-800 pt-5">
        <p className="text-xs text-zinc-500">Lascia un campo vuoto per mantenere il valore già salvato.</p>
        <Button type="submit" disabled={saving} className="shrink-0">
          {saving ? "Salvataggio…" : "Salva Chiavi API"}
        </Button>
      </div>
    </form>
  );
}
