"use client";

import { useState, type FormEvent } from "react";
import { Check, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IntegrationSettings } from "@/lib/integration-settings";

type FieldStatus = { configured: boolean; masked: string };
type KeysStatus = Record<keyof IntegrationSettings, FieldStatus>;
type Service = "stripe" | "resend" | "twilio";
type ConnectionState = "idle" | "testing" | "success" | "error";

type FieldConfig = {
  id: keyof IntegrationSettings;
  label: string;
  placeholder: string;
  helper: string;
};

const EMPTY_VALUES: Record<keyof IntegrationSettings, string> = {
  stripePublishableKey: "",
  stripeSecretKey: "",
  resendApiKey: "",
  twilioAccountSid: "",
  twilioAuthToken: "",
};

const SERVICES: { id: Service; name: string; fields: FieldConfig[] }[] = [
  {
    id: "stripe",
    name: "Stripe",
    fields: [
      {
        id: "stripePublishableKey",
        label: "Stripe Public Key",
        placeholder: "pk_live_...",
        helper:
          "Usata dal browser per inizializzare Stripe.js nel portale di pagamento.",
      },
      {
        id: "stripeSecretKey",
        label: "Stripe Secret Key",
        placeholder: "sk_live_...",
        helper:
          "Usata dal server per creare checkout, fatture e leggere gli eventi Stripe.",
      },
    ],
  },
  {
    id: "resend",
    name: "Resend",
    fields: [
      {
        id: "resendApiKey",
        label: "Resend API Key",
        placeholder: "re_...",
        helper: "Usata per inviare le email della sequenza dunning.",
      },
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    fields: [
      {
        id: "twilioAccountSid",
        label: "Twilio Account SID",
        placeholder: "AC...",
        helper: "Usato per inviare i solleciti via SMS e WhatsApp Business.",
      },
      {
        id: "twilioAuthToken",
        label: "Twilio Auth Token",
        placeholder: "",
        helper: "Token di autenticazione associato al tuo Account SID Twilio.",
      },
    ],
  },
];

function ConnectionBadge({
  state,
  message,
}: {
  state: ConnectionState;
  message?: string;
}) {
  if (state === "idle") return null;

  if (state === "testing") {
    return (
      <Badge className="h-auto bg-zinc-100 px-2 py-0.5 text-zinc-600">
        <Loader2 className="size-3 animate-spin" />
        Verifica…
      </Badge>
    );
  }

  const isSuccess = state === "success";
  return (
    <Badge
      title={message}
      className={cn(
        "h-auto px-2 py-0.5",
        isSuccess
          ? "bg-emerald-100 text-emerald-800"
          : "bg-rose-100 text-rose-800",
      )}
    >
      {isSuccess ? "🟢 Connesso" : "🔴 Errore"}
    </Badge>
  );
}

export function IntegrationKeysPanel({
  initialStatus,
}: {
  initialStatus: KeysStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [values, setValues] =
    useState<Record<keyof IntegrationSettings, string>>(EMPTY_VALUES);
  const [visible, setVisible] = useState<
    Partial<Record<keyof IntegrationSettings, boolean>>
  >({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [connectionState, setConnectionState] = useState<
    Record<Service, ConnectionState>
  >({
    stripe: "idle",
    resend: "idle",
    twilio: "idle",
  });
  const [connectionMessage, setConnectionMessage] = useState<
    Partial<Record<Service, string>>
  >({});

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const payload = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value.trim().length > 0),
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
      setValues(EMPTY_VALUES);
      setSavedAt(Date.now());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Errore durante il salvataggio.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function testConnection(service: Service) {
    setConnectionState((prev) => ({ ...prev, [service]: "testing" }));
    setConnectionMessage((prev) => ({ ...prev, [service]: undefined }));

    try {
      const response = await fetch("/api/dashboard/integration-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, ...values }),
      });
      const data = await response.json().catch(() => null);
      const ok = Boolean(data?.ok);

      setConnectionState((prev) => ({
        ...prev,
        [service]: ok ? "success" : "error",
      }));
      setConnectionMessage((prev) => ({
        ...prev,
        [service]: data?.message ?? "Errore durante la verifica.",
      }));
    } catch {
      setConnectionState((prev) => ({ ...prev, [service]: "error" }));
      setConnectionMessage((prev) => ({
        ...prev,
        [service]: "Impossibile contattare RecoverPulse. Riprova.",
      }));
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <KeyRound className="size-4 text-emerald-500" />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-900">Chiavi API</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Salvate su Supabase e usate subito nelle chiamate API, senza
              toccare i file .env.
            </p>
          </div>
        </div>
        {savedAt > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-600">
            <Check className="size-3.5" />
            Salvato
          </span>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {SERVICES.map((service) => (
          <div
            key={service.id}
            className="rounded-lg border border-zinc-200/80 bg-zinc-100 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-zinc-800">
                {service.name}
              </p>
              <div className="flex items-center gap-2">
                <ConnectionBadge
                  state={connectionState[service.id]}
                  message={connectionMessage[service.id]}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={connectionState[service.id] === "testing"}
                  onClick={() => testConnection(service.id)}
                >
                  {connectionState[service.id] === "testing"
                    ? "Verifica…"
                    : "Testa Connessione"}
                </Button>
              </div>
            </div>

            {connectionMessage[service.id] &&
              connectionState[service.id] === "error" && (
                <p className="mt-2 text-xs text-rose-500">
                  {connectionMessage[service.id]}
                </p>
              )}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {service.fields.map((field) => {
                const isVisible = visible[field.id] ?? false;
                return (
                  <div key={field.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={field.id}
                        className="text-sm font-medium text-zinc-700"
                      >
                        {field.label}
                      </label>
                      {status[field.id].configured && (
                        <Badge className="h-auto bg-emerald-100 px-2 py-0.5 text-emerald-800">
                          Configurata
                        </Badge>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id={field.id}
                        type={isVisible ? "text" : "password"}
                        autoComplete="off"
                        value={values[field.id]}
                        onChange={(event) =>
                          setValues((prev) => ({
                            ...prev,
                            [field.id]: event.target.value,
                          }))
                        }
                        placeholder={
                          status[field.id].configured
                            ? status[field.id].masked
                            : field.placeholder
                        }
                        className="h-10 w-full rounded-lg border border-zinc-200/80 bg-zinc-100 px-3 pr-10 font-mono text-sm text-zinc-900 placeholder:font-sans placeholder:text-zinc-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setVisible((prev) => ({
                            ...prev,
                            [field.id]: !isVisible,
                          }))
                        }
                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                        aria-label={
                          isVisible ? "Nascondi chiave" : "Mostra chiave"
                        }
                      >
                        {isVisible ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500">{field.helper}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-xs text-rose-500">{error}</p>}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-zinc-200/80 pt-5">
        <p className="text-xs text-zinc-500">
          Lascia un campo vuoto per mantenere il valore già salvato.
        </p>
        <Button type="submit" disabled={saving} className="shrink-0">
          {saving ? "Salvataggio…" : "Salva Chiavi API"}
        </Button>
      </div>
    </form>
  );
}
