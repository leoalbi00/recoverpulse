"use client";

import { useState } from "react";
import { Loader2, ShieldAlert, XCircle } from "lucide-react";

import { PaymentSuccessStep } from "@/components/update-payment/payment-success-step";
import { getReadableTextColor } from "@/lib/color";

type SimulatedPaymentFormProps = {
  token: string;
  planName: string;
  amountFormatted: string;
  primaryColor: string;
};

// Usato quando /pay/[token] non riesce a ottenere un vero SetupIntent Stripe
// (transazione di test generata da /api/test/generate-failed-payment, o
// chiavi Stripe mancanti/non valide): permette comunque di completare il
// test del flusso di recupero senza bloccare l'utente su un errore Stripe.
export function SimulatedPaymentForm({ token, planName, amountFormatted, primaryColor }: SimulatedPaymentFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (success) {
    return <PaymentSuccessStep planName={planName} amountFormatted={amountFormatted} />;
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/update-payment/${token}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulate: true }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "Impossibile completare la simulazione. Riprova.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Impossibile contattare RecoverPulse. Riprova.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-300">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <span>
          Modalità Simulazione: nessun addebito reale verrà effettuato su Stripe. Il pulsante simula l&apos;esito
          positivo dell&apos;aggiornamento carta.
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        disabled={submitting}
        onClick={handleConfirm}
        style={{ backgroundColor: primaryColor, color: getReadableTextColor(primaryColor) }}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold shadow-lg transition-all hover:brightness-[1.05] focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting ? "Simulazione in corso…" : "Conferma Aggiornamento Carta di Prova"}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
        Nessun dato di pagamento reale inviato · {amountFormatted}
      </p>
    </div>
  );
}
