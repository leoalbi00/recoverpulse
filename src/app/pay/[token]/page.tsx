import { Activity, AlertTriangle, ShieldCheck, XCircle } from "lucide-react";

import { getStripePublishableKeyForAccount } from "@/lib/stripe";
import { getStripeAccountIdForUser } from "@/lib/connected-stripe-accounts";
import { validatePaymentToken } from "@/lib/tokens";
import { getTransactionByCustomerId, type FailedTransaction } from "@/lib/transactions";
import { getMerchantSettings, DEFAULT_MERCHANT_SETTINGS, type MerchantSettings } from "@/lib/merchant-settings";
import { getReadableTextColor } from "@/lib/color";
import { tryCreateSetupIntent } from "@/lib/payment-portal";
import { UpdatePaymentForm } from "@/components/update-payment/update-payment-form";
import { DemoCardForm } from "@/components/update-payment/demo-card-form";
import { SimulatedPaymentForm } from "@/components/update-payment/simulated-payment-form";
import { SecurityBadges } from "@/components/update-payment/security-badges";

const DEMO_TOKENS = ["test-token-123", "demo"];

const DEMO_TRANSACTION = {
  customerName: "Cliente Demo",
  planName: "Abbonamento Pro",
  amount: 8900,
  currency: "usd",
  reason: "Carta rifiutata dall'istituto emittente (dati simulati)",
};

function ActionRequiredBadge() {
  return (
    <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
      <AlertTriangle className="size-3" />
      Azione Richiesta: Aggiorna Metodo di Pagamento
    </span>
  );
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function Shell({ children, merchant }: { children: React.ReactNode; merchant: MerchantSettings }) {
  const accentTextColor = getReadableTextColor(merchant.primaryColor);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 rounded-full opacity-10 blur-[120px]"
        style={{ backgroundColor: merchant.primaryColor }}
      />

      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          {merchant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL arbitrario del merchant, non ottimizzabile da next/image
            <img
              src={merchant.logoUrl}
              alt={merchant.companyName}
              className="size-8 shrink-0 rounded-lg object-contain"
            />
          ) : (
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: merchant.primaryColor }}
            >
              <Activity className="size-4" style={{ color: accentTextColor }} strokeWidth={2.5} />
            </span>
          )}
          <span className="text-base font-semibold tracking-tight text-white">{merchant.companyName}</span>
        </div>

        <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <div className="h-1 w-full" style={{ backgroundColor: merchant.primaryColor }} aria-hidden />
          <div className="min-w-0 p-6 sm:p-8">{children}</div>
        </div>

        <SecurityBadges />
      </div>
    </main>
  );
}

function InvalidLink({ merchant }: { merchant: MerchantSettings }) {
  return (
    <Shell merchant={merchant}>
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

function ConnectionError({ merchant }: { merchant: MerchantSettings }) {
  return (
    <Shell merchant={merchant}>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-red-400/10 ring-1 ring-red-400/30">
          <XCircle className="size-7 text-red-400" />
        </span>
        <div>
          <p className="text-lg font-semibold text-white">Servizio temporaneamente non disponibile</p>
          <p className="mt-1.5 text-sm text-zinc-400">
            Non siamo riusciti a verificare questo link in questo momento. Riprova tra qualche minuto o contatta il
            tuo fornitore se il problema persiste.
          </p>
        </div>
      </div>
    </Shell>
  );
}

function AlreadyRecovered({ transaction, merchant }: { transaction: FailedTransaction; merchant: MerchantSettings }) {
  return (
    <Shell merchant={merchant}>
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
      <Shell merchant={DEFAULT_MERCHANT_SETTINGS}>
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
          <ActionRequiredBadge />
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">{DEMO_TRANSACTION.planName}</p>
            <p className="text-sm font-semibold text-white">{amountFormatted}/mese</p>
          </div>
          <p className="mt-1 text-xs text-zinc-500">{DEMO_TRANSACTION.reason}</p>
        </div>

        <DemoCardForm
          planName={DEMO_TRANSACTION.planName}
          amountFormatted={amountFormatted}
          primaryColor={DEFAULT_MERCHANT_SETTINGS.primaryColor}
        />
      </Shell>
    );
  }

  // Il token deve esistere su Supabase, non essere già stato usato e non essere
  // scaduto: `validatePaymentToken` applica tutte e tre le condizioni nella query.
  // Un errore qui o nella lettura della transazione (es. Supabase irraggiungibile
  // o mal configurato in produzione) non deve far crashare la pagina con un 500:
  // mostriamo una schermata dedicata.
  let paymentToken: Awaited<ReturnType<typeof validatePaymentToken>>;
  let transaction: FailedTransaction | null;
  try {
    paymentToken = await validatePaymentToken(token);
    transaction = paymentToken
      ? await getTransactionByCustomerId(paymentToken.customerId, paymentToken.userId ?? undefined)
      : null;
  } catch (error) {
    console.error(`[pay-portal] errore nella verifica del token "${token}" su Supabase:`, error);
    return <ConnectionError merchant={DEFAULT_MERCHANT_SETTINGS} />;
  }

  if (!paymentToken) {
    return <InvalidLink merchant={DEFAULT_MERCHANT_SETTINGS} />;
  }

  if (!transaction) {
    // Token valido ma nessuna fattura fallita associata: caso "aggiornamento
    // preventivo" (es. da customer.source.expiring, src/app/api/webhooks/stripe/route.ts),
    // non un link rotto.
    const preventiveMerchant = paymentToken.userId
      ? await getMerchantSettings(paymentToken.userId)
      : DEFAULT_MERCHANT_SETTINGS;

    const preventiveClientSecret = paymentToken.userId
      ? await tryCreateSetupIntent({ userId: paymentToken.userId, customerId: paymentToken.customerId })
      : null;

    // v1: solo Stripe reale per l'aggiornamento preventivo, nessuna modalità
    // simulata (eviterebbe di triplicare la logica demo/simulazione già
    // esistente per un caso d'uso a basso traffico).
    if (!preventiveClientSecret) {
      return (
        <Shell merchant={preventiveMerchant}>
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-red-400/10 ring-1 ring-red-400/30">
              <XCircle className="size-7 text-red-400" />
            </span>
            <div>
              <p className="text-lg font-semibold text-white">Servizio non disponibile</p>
              <p className="mt-1.5 text-sm text-zinc-400">
                Non riusciamo ad aggiornare la carta in questo momento. Contatta il tuo fornitore per assistenza.
              </p>
            </div>
          </div>
        </Shell>
      );
    }

    const preventiveStripeAccountId = paymentToken.userId
      ? await getStripeAccountIdForUser(paymentToken.userId).catch(() => null)
      : null;
    const preventiveStripePublishableKey = preventiveStripeAccountId
      ? await getStripePublishableKeyForAccount(preventiveStripeAccountId)
      : "";

    return (
      <Shell merchant={preventiveMerchant}>
        <div className="mb-6 text-center">
          <p className="text-xs font-medium tracking-wide text-emerald-400 uppercase">Aggiornamento carta</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Aggiorna il tuo metodo di pagamento
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            La tua carta salvata sta per scadere: aggiornala per evitare interruzioni al prossimo rinnovo.
          </p>
        </div>

        <UpdatePaymentForm
          token={token}
          clientSecret={preventiveClientSecret}
          planName="il tuo abbonamento"
          amountFormatted=""
          primaryColor={preventiveMerchant.primaryColor}
          stripePublishableKey={preventiveStripePublishableKey}
          mode="update"
        />
      </Shell>
    );
  }

  const merchant = await getMerchantSettings(transaction.userId);

  if (transaction.status === "recuperato") {
    return <AlreadyRecovered transaction={transaction} merchant={merchant} />;
  }

  const amountFormatted = formatAmount(transaction.amount, transaction.currency);
  const clientSecret = await tryCreateSetupIntent({ userId: transaction.userId, customerId: transaction.customerId });

  // Nessun vero SetupIntent Stripe ottenibile: transazione di test generata
  // da /api/test/generate-failed-payment (customer Stripe inesistente) o
  // chiavi Stripe mancanti/non valide. Invece di bloccare l'utente su un
  // errore Stripe, il portale entra in modalità "Simulazione".
  if (!clientSecret) {
    return (
      <Shell merchant={merchant}>
        <div className="mb-6 text-center">
          <p className="text-xs font-medium tracking-wide text-amber-400 uppercase">
            Modalità Simulazione
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Riattiva il tuo abbonamento
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Ciao {transaction.customerName}, per questa transazione non è disponibile un vero addebito Stripe: usa
            la conferma simulata per proseguire il test del flusso di recupero.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-white/10 bg-zinc-950/60 p-4">
          <ActionRequiredBadge />
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">{transaction.planName}</p>
            <p className="text-sm font-semibold text-white">{amountFormatted}</p>
          </div>
          <p className="mt-1 text-xs text-zinc-500">{transaction.reason}</p>
        </div>

        <SimulatedPaymentForm
          token={token}
          planName={transaction.planName}
          amountFormatted={amountFormatted}
          primaryColor={merchant.primaryColor}
        />
      </Shell>
    );
  }

  const stripeAccountId = await getStripeAccountIdForUser(transaction.userId).catch(() => null);
  const stripePublishableKey = stripeAccountId ? await getStripePublishableKeyForAccount(stripeAccountId) : "";

  return (
    <Shell merchant={merchant}>
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
        <ActionRequiredBadge />
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
        primaryColor={merchant.primaryColor}
        stripePublishableKey={stripePublishableKey}
      />
    </Shell>
  );
}
