import { Lock, ShieldCheck } from "lucide-react";

type PaymentProvider = "stripe" | "paypal";

const PROVIDER_LABEL: Record<PaymentProvider, string> = {
  stripe: "Stripe",
  paypal: "PayPal",
};

/**
 * Badge di garanzia mostrati su ogni stato del portale /pay/[token] (form,
 * successo, errori) per rassicurare l'utente sulla sicurezza della transazione.
 *
 * Senza `provider` il secondo badge resta neutro: il portale serve anche i
 * flussi PayPal e la modalità Simulazione, dove "Powered by Stripe" sarebbe
 * un'indicazione non veritiera.
 */
export function SecurityBadges({ provider }: { provider?: PaymentProvider } = {}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <ShieldCheck className="size-3.5 text-emerald-600" />
        Connessione cifrata HTTPS/TLS
      </span>
      <span className="h-3 w-px bg-slate-300" aria-hidden />
      <span className="flex items-center gap-1.5">
        <Lock className="size-3.5 text-muted-foreground" />
        {provider ? (
          <>
            Pagamento gestito da <span className="font-semibold text-slate-700">{PROVIDER_LABEL[provider]}</span>
          </>
        ) : (
          "Dati di pagamento gestiti direttamente dal provider di pagamento"
        )}
      </span>
    </div>
  );
}
