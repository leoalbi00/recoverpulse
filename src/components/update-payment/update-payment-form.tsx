"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";

import { getStripe } from "@/lib/stripe-client";
import { getReadableTextColor } from "@/lib/color";
import { PaymentSuccessStep } from "@/components/update-payment/payment-success-step";

type UpdatePaymentFormProps = {
  token: string;
  clientSecret: string;
  planName: string;
  amountFormatted: string;
  primaryColor: string;
  stripePublishableKey: string;
  /** "update": aggiornamento preventivo della carta (nessun importo da mostrare/riaddebitare). */
  mode?: "payment" | "update";
};

function CardStep({
  token,
  amountFormatted,
  primaryColor,
  mode = "payment",
  onSuccess,
}: {
  token: string;
  amountFormatted: string;
  primaryColor: string;
  mode?: "payment" | "update";
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elementReady, setElementReady] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: submitError, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (submitError || !setupIntent) {
      setError(submitError?.message ?? "Impossibile verificare la carta. Riprova.");
      setSubmitting(false);
      return;
    }

    const response = await fetch(`/api/update-payment/${token}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setupIntentId: setupIntent.id }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.error ?? "Impossibile completare l'aggiornamento. Riprova.");
      setSubmitting(false);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="relative w-full min-w-0 box-border min-h-[220px] rounded-xl border border-border bg-muted p-4">
        {!elementReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-xs text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-emerald-700" />
            Caricamento modulo di pagamento sicuro…
          </div>
        )}
        <div className={elementReady ? "" : "invisible"}>
          <PaymentElement options={{ layout: "tabs" }} onReady={() => setElementReady(true)} />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elementReady || submitting}
        style={{ backgroundColor: primaryColor, color: getReadableTextColor(primaryColor) }}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold shadow-lg transition-all hover:brightness-[1.05] focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting
          ? "Verifica in corso…"
          : mode === "update"
            ? "Aggiorna Carta"
            : `Paga e Aggiorna Carta (${amountFormatted})`}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        I tuoi dati sono elaborati in modo sicuro da Stripe
      </p>
    </form>
  );
}

export function UpdatePaymentForm({
  token,
  clientSecret,
  planName,
  amountFormatted,
  primaryColor,
  stripePublishableKey,
  mode = "payment",
}: UpdatePaymentFormProps) {
  const [success, setSuccess] = useState(false);

  if (success) {
    return <PaymentSuccessStep planName={planName} amountFormatted={amountFormatted} mode={mode} />;
  }

  return (
    <Elements
      stripe={getStripe(stripePublishableKey)}
      options={{
        clientSecret,
        // Tema chiaro di Stripe, allineato allo scope `light` del portale
        // (palette slate: testo #0F172A, secondario #64748B, bordi slate-300).
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: primaryColor,
            colorBackground: "#ffffff",
            colorText: "#0f172a",
            colorTextSecondary: "#64748b",
            colorTextPlaceholder: "#94a3b8",
            colorDanger: "#e11d48",
            borderRadius: "10px",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            fontSizeBase: "15px",
            spacingUnit: "4px",
          },
          rules: {
            ".Tab": {
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              boxShadow: "none",
            },
            ".Tab:hover": {
              backgroundColor: "#f8fafc",
            },
            ".Tab--selected": {
              borderColor: primaryColor,
              boxShadow: `0 0 0 1px ${primaryColor}`,
            },
            ".Input": {
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              boxShadow: "none",
            },
            ".Input:focus": {
              border: `1px solid ${primaryColor}`,
              boxShadow: `0 0 0 1px ${primaryColor}`,
            },
            ".Label": {
              color: "#475569",
              fontSize: "13px",
            },
          },
        },
      }}
    >
      <CardStep
        token={token}
        amountFormatted={amountFormatted}
        primaryColor={primaryColor}
        mode={mode}
        onSuccess={() => setSuccess(true)}
      />
    </Elements>
  );
}
