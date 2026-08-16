"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import { getStripe } from "@/lib/stripe-client";

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
      <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-500 px-4 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
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

function SuccessStep({ planName }: { planName: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/30">
        <CheckCircle2 className="size-7 text-emerald-400" />
      </span>
      <div>
        <p className="text-lg font-semibold text-white">Carta aggiornata con successo</p>
        <p className="mt-1.5 text-sm text-zinc-400">
          Il pagamento è stato riaddebitato e l&apos;abbonamento <span className="text-white">{planName}</span>{" "}
          è di nuovo attivo. Riceverai una conferma via email.
        </p>
      </div>
    </div>
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
    return <SuccessStep planName={planName} />;
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
            colorDanger: "#f87171",
            borderRadius: "10px",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
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
