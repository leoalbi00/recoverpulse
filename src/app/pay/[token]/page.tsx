import { Activity, ShieldCheck, XCircle } from "lucide-react";

import { stripe } from "@/lib/stripe";
import { resolveInvoiceIdFromToken } from "@/lib/payment-links";
import { getTransaction, type FailedTransaction } from "@/lib/transactions";
import { UpdatePaymentForm } from "@/components/update-payment/update-payment-form";
import { DemoCardForm } from "@/components/update-payment/demo-card-form";

const DEMO_TOKENS = ["test-token-123", "demo"];

const DEMO_TRANSACTION = {
  customerName: "Cliente Demo",
  planName: "Abbonamento Pro",
  amount: 8900,
  currency: "usd",
  reason: "Carta rifiutata dall'istituto emittente (dati simulati)",
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500">
            <Activity className="size-4 text-black" strokeWidth={2.5} />
          </span>
          <span className="text-base font-semibold tracking-tight text-white">RecoverPulse</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}

function InvalidLink() {
  return (
    <Shell>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-red-400/10 ring-1 ring-red-400/30">
          <XCircle className="size-7 text-red-400" />
        </span>
        <div>
          <p className="text-lg font-semibold text-white">Link non valido o scaduto</p>
          <p className="mt-1.5 text-sm text-zinc-400">
            Questo link di aggiornamento carta non è più attivo. Contatta il tuo fornitore per riceverne uno nuovo.
          </p>
        </div>
      </div>
    </Shell>
  );
}

function SetupError() {
  return (
    <Shell>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-red-400/10 ring-1 ring-red-400/30">
          <XCircle className="size-7 text-red-400" />
        </span>
        <div>
          <p className="text-lg font-semibold text-white">Impossibile avviare l&apos;aggiornamento</p>
          <p className="mt-1.5 text-sm text-zinc-400">
            Si è verificato un problema nel comunicare con Stripe. Riprova più tardi o contatta il tuo fornitore.
          </p>
        </div>
      </div>
    </Shell>
  );
}

function AlreadyRecovered({ transaction }: { transaction: FailedTransaction }) {
  return (
    <Shell>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/30">
          <ShieldCheck className="size-7 text-emerald-400" />
        </span>
        <div>
          <p className="text-lg font-semibold text-white">Abbonamento già attivo</p>
          <p className="mt-1.5 text-sm text-zinc-400">
            Il pagamento per <span className="text-white">{transaction.planName}</span> è già stato recuperato con
            successo. Non è necessaria nessuna altra azione.
          </p>
        </div>
      </div>
    </Shell>
  );
}

export default async function UpdatePaymentPage({ params }: PageProps<"/pay/[token]">) {
  const { token } = await params;

  if (DEMO_TOKENS.includes(token)) {
    const amountFormatted = formatAmount(DEMO_TRANSACTION.amount, DEMO_TRANSACTION.currency);

    return (
      <Shell>
        <div className="mb-6 text-center">
          <p className="text-xs font-medium tracking-wide text-emerald-400 uppercase">
            Demo · Portale 1-Click
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Riattiva il tuo abbonamento
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Ciao {DEMO_TRANSACTION.customerName}, questa è un&apos;anteprima con dati simulati del portale di
            aggiornamento carta.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-white/10 bg-zinc-950/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">{DEMO_TRANSACTION.planName}</p>
            <p className="text-sm font-semibold text-white">{amountFormatted}/mese</p>
          </div>
          <p className="mt-1 text-xs text-zinc-500">{DEMO_TRANSACTION.reason}</p>
        </div>

        <DemoCardForm planName={DEMO_TRANSACTION.planName} amountFormatted={amountFormatted} />
      </Shell>
    );
  }

  const invoiceId = resolveInvoiceIdFromToken(token);
  const transaction = invoiceId ? getTransaction(invoiceId) : null;

  if (!transaction) {
    return <InvalidLink />;
  }

  if (transaction.status === "recuperato") {
    return <AlreadyRecovered transaction={transaction} />;
  }

  let clientSecret: string | null;
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: transaction.customerId,
      payment_method_types: ["card"],
      usage: "off_session",
    });
    clientSecret = setupIntent.client_secret;
  } catch (error) {
    console.error("Errore creazione SetupIntent Stripe:", error);
    clientSecret = null;
  }

  if (!clientSecret) {
    return <SetupError />;
  }

  const amountFormatted = formatAmount(transaction.amount, transaction.currency);

  return (
    <Shell>
      <div className="mb-6 text-center">
        <p className="text-xs font-medium tracking-wide text-emerald-400 uppercase">
          Aggiornamento metodo di pagamento
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Riattiva il tuo abbonamento
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Ciao {transaction.customerName}, il tuo ultimo pagamento non è andato a buon fine. Aggiorna la carta per
          continuare senza interruzioni.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-white/10 bg-zinc-950/60 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400">{transaction.planName}</p>
          <p className="text-sm font-semibold text-white">{amountFormatted}</p>
        </div>
        <p className="mt-1 text-xs text-zinc-500">{transaction.reason}</p>
      </div>

      <UpdatePaymentForm
        token={token}
        clientSecret={clientSecret}
        planName={transaction.planName}
        amountFormatted={amountFormatted}
      />
    </Shell>
  );
}
