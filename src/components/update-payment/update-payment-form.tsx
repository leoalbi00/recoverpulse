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
import { PaymentSuccessStep } from "@/components/update-payment/payment-success-step";

type UpdatePaymentFormProps = {
  token: string;
  clientSecret: string;
  planName: string;
  amountFormatted: string;
};

function CardStep({
  token,
  planName,
  amountFormatted,
  onSuccess,
}: {
  token: string;
  planName: string;
  amountFormatted: string;
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
      <div className="relative min-h-[220px] rounded-xl border border-white/10 bg-zinc-950/60 p-4">
        {!elementReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-xs text-zinc-500">
            <Loader2 className="size-5 animate-spin text-emerald-400" />
            Caricamento modulo di pagamento sicuro…
          </div>
        )}
        <div className={elementReady ? "" : "invisible"}>
          <PaymentElement options={{ layout: "tabs" }} onReady={() => setElementReady(true)} />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elementReady || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-500 px-4 py-3.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:brightness-[1.03] focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting ? "Verifica in corso…" : `Aggiorna carta e sblocca ${planName}`}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
        <ShieldCheck className="size-3.5" />
        Pagamento elaborato in modo sicuro da Stripe · {amountFormatted}
      </p>
    </form>
  );
}

export function UpdatePaymentForm({
  token,
  clientSecret,
  planName,
  amountFormatted,
}: UpdatePaymentFormProps) {
  const [success, setSuccess] = useState(false);

  if (success) {
    return <PaymentSuccessStep planName={planName} amountFormatted={amountFormatted} />;
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#34d399",
            colorBackground: "#09090b",
            colorText: "#f4f4f5",
            colorTextSecondary: "#a1a1aa",
            colorTextPlaceholder: "#52525b",
            colorDanger: "#f87171",
            borderRadius: "10px",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            fontSizeBase: "15px",
            spacingUnit: "4px",
          },
          rules: {
            ".Tab": {
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.02)",
              boxShadow: "none",
            },
            ".Tab:hover": {
              backgroundColor: "rgba(255,255,255,0.05)",
            },
            ".Tab--selected": {
              borderColor: "#34d399",
              backgroundColor: "rgba(52,211,153,0.08)",
              boxShadow: "0 0 0 1px #34d399",
            },
            ".Input": {
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "rgba(255,255,255,0.02)",
              boxShadow: "none",
            },
            ".Input:focus": {
              border: "1px solid #34d399",
              boxShadow: "0 0 0 1px #34d399",
            },
            ".Label": {
              color: "#a1a1aa",
              fontSize: "13px",
            },
          },
        },
      }}
    >
      <CardStep
        token={token}
        planName={planName}
        amountFormatted={amountFormatted}
        onSuccess={() => setSuccess(true)}
      />
    </Elements>
  );
}
