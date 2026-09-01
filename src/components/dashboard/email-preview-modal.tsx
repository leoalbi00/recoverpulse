"use client";

import { useEffect } from "react";
import { Mail, X } from "lucide-react";

/**
 * Anteprima dell'email già renderizzata (variabili {{...}} sostituite),
 * riusata sia dall'editor dei modelli (src/components/dashboard/dunning-templates-manager.tsx)
 * sia da qualsiasi altro punto che debba mostrare com'è "un'email dunning
 * finita" prima dell'invio reale. Stesso pattern a overlay già usato per
 * LeadDetailModal (src/components/dashboard/notifications-manager.tsx):
 * chiusura su Escape, clic sull'overlay o sulla X.
 */
export function EmailPreviewModal({
  companyName,
  recipientLabel,
  subject,
  body,
  onClose,
}: {
  companyName: string;
  recipientLabel: string;
  subject: string;
  body: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-white text-zinc-900 shadow-lg"
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 px-5 py-4">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-emerald-600" />
            <p className="text-sm font-semibold text-zinc-900">Anteprima email</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
            aria-label="Chiudi anteprima"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 border-b border-zinc-200/80 bg-zinc-50 px-5 py-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-semibold text-emerald-700">
            {companyName.charAt(0).toUpperCase() || "?"}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-medium text-zinc-900">{companyName}</p>
            <p className="truncate text-[11px] text-zinc-500">a {recipientLabel}</p>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          <p className="mb-3 border-b border-zinc-100 pb-3 text-sm font-semibold text-zinc-900">
            {subject || <span className="font-normal text-zinc-400">(nessun oggetto)</span>}
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-700">
            {body || <span className="text-zinc-400">(nessun testo)</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
