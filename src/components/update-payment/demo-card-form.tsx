"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import { PaymentSuccessStep } from "@/components/update-payment/payment-success-step";
import { getReadableTextColor } from "@/lib/color";

type DemoCardFormProps = {
  planName: string;
  amountFormatted: string;
  primaryColor: string;
};

// Modulo carta interamente simulato: nessuna chiamata a Stripe.js o alle API,
// pensato per demo/anteprima del portale 1-click senza dipendenze esterne.
export function DemoCardForm({ planName, amountFormatted, primaryColor }: DemoCardFormProps) {
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (success) {
    return <PaymentSuccessStep planName={planName} amountFormatted={amountFormatted} />;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 900);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-3 rounded-xl border border-border bg-muted p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="demo-cardholder-name" className="text-xs font-medium text-muted-foreground">
            Titolare carta
          </label>
          <input
            id="demo-cardholder-name"
            type="text"
            autoComplete="cc-name"
            required
            placeholder="Mario Rossi"
            value={cardholderName}
            onChange={(event) => setCardholderName(event.target.value)}
            className="box-border h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="demo-card-number" className="text-xs font-medium text-muted-foreground">
            Numero carta
          </label>
          <input
            id="demo-card-number"
            type="text"
            inputMode="numeric"
            required
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={(event) => setCardNumber(event.target.value)}
            className="box-border h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="grid w-full min-w-0 grid-cols-2 gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="demo-card-expiry" className="text-xs font-medium text-muted-foreground">
              Scadenza
            </label>
            <input
              id="demo-card-expiry"
              type="text"
              required
              placeholder="MM/AA"
              value={expiry}
              onChange={(event) => setExpiry(event.target.value)}
              className="box-border h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="demo-card-cvc" className="text-xs font-medium text-muted-foreground">
              CVC
            </label>
            <input
              id="demo-card-cvc"
              type="text"
              inputMode="numeric"
              required
              placeholder="123"
              value={cvc}
              onChange={(event) => setCvc(event.target.value)}
              className="box-border h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{ backgroundColor: primaryColor, color: getReadableTextColor(primaryColor) }}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold shadow-lg transition-all hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting ? "Verifica in corso…" : `Paga e Aggiorna Carta (${amountFormatted})`}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        I tuoi dati sono elaborati in modo sicuro da Stripe · Modulo di prova (demo)
      </p>
    </form>
  );
}
