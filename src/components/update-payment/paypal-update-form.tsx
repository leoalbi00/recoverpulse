"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, XCircle } from "lucide-react";

import { PaymentSuccessStep } from "@/components/update-payment/payment-success-step";

// Tipizzazione minima dell'SDK PayPal JS (caricato via <script> a runtime,
// non è un pacchetto npm): solo la superficie usata qui, non l'intera API.
type PaypalButtonsActions = {
  subscription: { revise: (subscriptionId: string, options: Record<string, unknown>) => Promise<string> };
};
type PaypalButtonsData = { subscriptionID?: string };
declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        style?: Record<string, unknown>;
        createSubscription: (data: unknown, actions: PaypalButtonsActions) => Promise<string>;
        onApprove: (data: PaypalButtonsData) => void;
        onError?: (err: unknown) => void;
      }) => { render: (selector: string) => void };
    };
  }
}

const SDK_SCRIPT_ID = "paypal-sdk-script";

function loadPaypalSdk(clientId: string): Promise<void> {
  if (window.paypal) return Promise.resolve();

  const existing = document.getElementById(SDK_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Caricamento SDK PayPal non riuscito.")));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SDK_SCRIPT_ID;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&vault=true&intent=subscription`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Caricamento SDK PayPal non riuscito."));
    document.body.appendChild(script);
  });
}

type PaypalUpdateFormProps = {
  token: string;
  subscriptionId: string;
  paypalClientId: string;
  planName: string;
  amountFormatted: string;
};

/**
 * Equivalente PayPal di UpdatePaymentForm (Stripe Elements): PayPal non offre
 * un widget per "aggiornare la carta di una subscription esistente" come il
 * SetupIntent Stripe, ma i PayPal Smart Buttons supportano nativamente la
 * "revise" di una subscription già creata (actions.subscription.revise) —
 * l'utente riapprova lo stesso abbonamento con un metodo di pagamento
 * valido, senza doverne creare uno nuovo lato merchant.
 */
export function PaypalUpdateForm({ token, subscriptionId, paypalClientId, planName, amountFormatted }: PaypalUpdateFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "confirming" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadPaypalSdk(paypalClientId)
      .then(() => {
        if (cancelled || !containerRef.current || !window.paypal) return;

        window.paypal
          .Buttons({
            style: { layout: "vertical", color: "gold", shape: "pill", label: "pay" },
            createSubscription: (_data, actions) => actions.subscription.revise(subscriptionId, {}),
            onApprove: async (data) => {
              setStatus("confirming");
              try {
                const response = await fetch(`/api/update-payment/${token}/confirm`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ paypalSubscriptionId: data.subscriptionID ?? subscriptionId }),
                });
                const result = await response.json().catch(() => null);
                if (!response.ok) throw new Error(result?.error ?? "Impossibile completare l'aggiornamento.");
                setStatus("success");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Impossibile completare l'aggiornamento.");
                setStatus("error");
              }
            },
            onError: () => {
              setError("PayPal ha segnalato un errore durante l'approvazione. Riprova.");
              setStatus("error");
            },
          })
          .render(`#${containerRef.current.id}`);

        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setError("Impossibile caricare PayPal. Riprova tra qualche minuto.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [paypalClientId, subscriptionId, token]);

  if (status === "success") {
    return <PaymentSuccessStep planName={planName} amountFormatted={amountFormatted} />;
  }

  return (
    <div className="space-y-5">
      <div className="relative min-h-[52px] w-full min-w-0 box-border">
        {(status === "loading" || status === "confirming") && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <Loader2 className="size-4 animate-spin text-emerald-400" />
            {status === "confirming" ? "Verifica in corso…" : "Caricamento PayPal…"}
          </div>
        )}
        <div id="paypal-button-container" ref={containerRef} className={status === "loading" ? "invisible" : ""} />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
