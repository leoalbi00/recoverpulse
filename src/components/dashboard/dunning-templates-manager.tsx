"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown, Mail, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { DunningTemplateStep, DunningTemplatesSettings } from "@/lib/dunning-templates";

const VARIABLES = [
  { token: "{{nome_cliente}}", label: "Nome cliente" },
  { token: "{{importo}}", label: "Importo" },
  { token: "{{nome_piano}}", label: "Nome piano" },
  { token: "{{nome_azienda}}", label: "Nome azienda" },
  { token: "{{link_recupero}}", label: "Link recupero" },
];

type Toast = { id: number; message: string };

export function DunningTemplatesManager({ initialSettings }: { initialSettings: DunningTemplatesSettings }) {
  const [automationEnabled, setAutomationEnabled] = useState(initialSettings.automationEnabled);
  const [steps, setSteps] = useState(initialSettings.steps);
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const subjectRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const bodyRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const lastFocusedField = useRef<Record<string, "subject" | "body">>({});

  function showToast(message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }

  function updateStep(id: string, patch: Partial<DunningTemplateStep>) {
    setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  }

  function insertVariable(stepId: string, token: string) {
    const field = lastFocusedField.current[stepId] ?? "body";

    if (field === "subject") {
      const input = subjectRefs.current[stepId];
      const step = steps.find((s) => s.id === stepId);
      if (!step) return;
      const start = input?.selectionStart ?? step.subject.length;
      const end = input?.selectionEnd ?? step.subject.length;
      const nextValue = step.subject.slice(0, start) + token + step.subject.slice(end);
      updateStep(stepId, { subject: nextValue });
      requestAnimationFrame(() => {
        input?.focus();
        input?.setSelectionRange(start + token.length, start + token.length);
      });
    } else {
      const textarea = bodyRefs.current[stepId];
      const step = steps.find((s) => s.id === stepId);
      if (!step) return;
      const start = textarea?.selectionStart ?? step.body.length;
      const end = textarea?.selectionEnd ?? step.body.length;
      const nextValue = step.body.slice(0, start) + token + step.body.slice(end);
      updateStep(stepId, { body: nextValue });
      requestAnimationFrame(() => {
        textarea?.focus();
        textarea?.setSelectionRange(start + token.length, start + token.length);
      });
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch("/api/dashboard/dunning-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automationEnabled, steps }),
      });
      if (!response.ok) throw new Error("save failed");
      showToast("Sequenza salvata con successo");
    } catch {
      showToast("Errore durante il salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 shadow-sm hover:shadow-md dark:shadow-xl dark:shadow-black/20 dark:backdrop-blur-sm">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Automazione {automationEnabled ? "Attiva" : "In Pausa"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Quando è attiva, ogni pagamento fallito avvia automaticamente la sequenza di solleciti qui sotto.
          </p>
        </div>
        <Switch
          checked={automationEnabled}
          onCheckedChange={setAutomationEnabled}
          aria-label="Attiva o metti in pausa l'automazione dunning"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 shadow-sm hover:shadow-md dark:shadow-xl dark:shadow-black/20 dark:backdrop-blur-sm sm:p-8">
        <ul className="flex flex-col">
          {steps.map((step, index) => (
            <li key={step.id} className="relative pb-8 last:pb-0">
              {index < steps.length - 1 && (
                <span className="absolute top-8 left-4 -ml-px h-full w-px bg-zinc-100 dark:bg-zinc-800" aria-hidden />
              )}

              <div className="flex gap-4">
                <span
                  className={cn(
                    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    step.enabled
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                      : "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500"
                  )}
                >
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{step.label}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{step.description}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {step.delayDays > 0 && (
                        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                          T+
                          <input
                            type="number"
                            min={1}
                            max={90}
                            value={step.delayDays}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              if (Number.isFinite(value) && value > 0) updateStep(step.id, { delayDays: value });
                            }}
                            className="h-8 w-16 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950/60 px-2 text-center text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                          />
                          giorni
                        </label>
                      )}

                      <Switch
                        checked={step.enabled}
                        onCheckedChange={(checked) => updateStep(step.id, { enabled: checked })}
                        aria-label={`Attiva/disattiva ${step.label}`}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setOpenStepId((current) => (current === step.id ? null : step.id))}
                      >
                        <PenLine className="size-3.5" />
                        Modifica modello email
                        <ChevronDown
                          className={cn("size-3.5 transition-transform", openStepId === step.id && "rotate-180")}
                        />
                      </Button>
                    </div>
                  </div>

                  {openStepId === step.id && (
                    <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950/50 p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        <Mail className="size-3.5" />
                        Variabili disponibili
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {VARIABLES.map((variable) => (
                          <button
                            key={variable.token}
                            type="button"
                            title={variable.label}
                            onClick={() => insertVariable(step.id, variable.token)}
                            className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-emerald-400 transition-colors hover:bg-emerald-500/20"
                          >
                            {variable.token}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-col gap-1.5">
                        <label htmlFor={`subject-${step.id}`} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Oggetto email
                        </label>
                        <input
                          id={`subject-${step.id}`}
                          ref={(el) => {
                            subjectRefs.current[step.id] = el;
                          }}
                          type="text"
                          value={step.subject}
                          onFocus={() => {
                            lastFocusedField.current[step.id] = "subject";
                          }}
                          onChange={(event) => updateStep(step.id, { subject: event.target.value })}
                          className="h-10 w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 px-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="mt-4 flex flex-col gap-1.5">
                        <label htmlFor={`body-${step.id}`} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Testo dell&apos;email
                        </label>
                        <textarea
                          id={`body-${step.id}`}
                          ref={(el) => {
                            bodyRefs.current[step.id] = el;
                          }}
                          value={step.body}
                          onFocus={() => {
                            lastFocusedField.current[step.id] = "body";
                          }}
                          onChange={(event) => updateStep(step.id, { body: event.target.value })}
                          rows={8}
                          className="w-full min-w-0 resize-y rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3 font-mono text-xs leading-relaxed text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Salvataggio…" : "Salva Sequenza"}
        </Button>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 sm:items-end sm:pr-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 shadow-lg dark:shadow-2xl dark:shadow-black/60"
          >
            <Check className="size-4 text-emerald-500" />
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
