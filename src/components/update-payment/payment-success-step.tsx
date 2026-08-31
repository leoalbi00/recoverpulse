import { CheckCircle2 } from "lucide-react";

type PaymentSuccessStepProps = {
  planName: string;
  amountFormatted?: string;
  /** "update": aggiornamento preventivo della carta (customer.source.expiring), nessun riaddebito né email di conferma inviata. */
  mode?: "payment" | "update";
};

/**
 * Schermata di conferma successo condivisa da UpdatePaymentForm (Stripe reale)
 * e DemoCardForm (anteprima): stesso momento "wow" ovunque il flusso finisca.
 */
export function PaymentSuccessStep({ planName, amountFormatted, mode = "payment" }: PaymentSuccessStepProps) {
  const isUpdate = mode === "update";

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <span className="relative flex size-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
        <span className="relative flex size-16 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/30">
          <CheckCircle2 className="size-8 text-emerald-400" strokeWidth={1.75} />
        </span>
      </span>

      <div>
        <p className="text-xl font-semibold tracking-tight text-white">
          {isUpdate ? "Carta aggiornata con successo!" : "Pagamento effettuato con successo!"}
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
          {isUpdate ? (
            "Il tuo metodo di pagamento è stato aggiornato."
          ) : (
            <>
              Il pagamento{amountFormatted ? ` di ${amountFormatted}` : ""} è stato riaddebitato e l&apos;abbonamento{" "}
              <span className="font-medium text-white">{planName}</span> è di nuovo attivo.
            </>
          )}
        </p>
      </div>

      <div className="w-full rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-xs text-emerald-300/80">
        {isUpdate
          ? "Nessuna altra azione richiesta."
          : "Riceverai una email di conferma a breve. Nessuna altra azione richiesta."}
      </div>
    </div>
  );
}
