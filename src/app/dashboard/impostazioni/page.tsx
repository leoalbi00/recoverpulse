import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { IntegrationKeysPanel } from "@/components/dashboard/integration-keys-panel";
import { MerchantSettingsPanel } from "@/components/dashboard/merchant-settings-panel";
import { StripeConnectCard } from "@/components/dashboard/stripe-connect-card";
import { SubscriptionCard } from "@/components/dashboard/subscription-card";
import { PlanButton } from "@/components/billing/plan-button";
import { getIntegrationSettings, maskSecret } from "@/lib/integration-settings";
import { getMerchantSettings } from "@/lib/merchant-settings";
import { getConnectedAccountForUser } from "@/lib/connected-stripe-accounts";
import { getStripeCustomerForUser } from "@/lib/billing";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

export default async function ImpostazioniPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const settings = await getIntegrationSettings();
  const merchantSettings = await getMerchantSettings(session.user.id);
  const connectedAccount = await getConnectedAccountForUser(session.user.id);
  const keysStatus = {
    resendApiKey: {
      configured: settings.resendApiKey.length > 0,
      masked: maskSecret(settings.resendApiKey),
    },
    twilioAccountSid: {
      configured: settings.twilioAccountSid.length > 0,
      masked: maskSecret(settings.twilioAccountSid),
    },
    twilioAuthToken: {
      configured: settings.twilioAuthToken.length > 0,
      masked: maskSecret(settings.twilioAuthToken),
    },
  };

  const hasSubscription = getStripeCustomerForUser(session.user.id) !== null;

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Impostazioni
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Collega Stripe, i tuoi canali di notifica e gestisci
          l&apos;abbonamento a RecoverPulse.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-300">
          Brand &amp; Personalizzazione
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          Nome azienda, logo e colore mostrati nelle email di sollecito e nel
          portale di aggiornamento carta.
        </p>
        <div className="mt-3">
          <MerchantSettingsPanel initialSettings={merchantSettings} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-zinc-300">Account Stripe</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Nessuna chiave da incollare né webhook da configurare a mano: un
          click autorizza RecoverPulse a leggere i pagamenti falliti del tuo
          account e a intervenire per te.
        </p>
        <div className="mt-3">
          <StripeConnectCard
            connected={connectedAccount !== null}
            stripeAccountId={connectedAccount?.stripeAccountId ?? null}
            livemode={connectedAccount?.livemode ?? null}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-zinc-300">Chiavi API</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Collega i tuoi provider per attivare i canali dunning via SMS e
          WhatsApp.
        </p>
        <div className="mt-3">
          <IntegrationKeysPanel initialStatus={keysStatus} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-zinc-300">
          Piano &amp; Fatturazione
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          Gestisci l&apos;abbonamento corrente o passa a un piano con più volumi
          e canali dunning.
        </p>
        <div className="mt-3">
          <SubscriptionCard hasSubscription={hasSubscription} />
        </div>
        <div className="mt-5 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex h-full flex-col rounded-xl border border-zinc-200/80 bg-white text-zinc-900 p-6 shadow-md",
                plan.popular && "ring-2 ring-emerald-500/50",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">
                  {plan.name}
                </p>
                {plan.popular && (
                  <Badge className="h-auto px-2 py-0.5">Consigliato</Badge>
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-zinc-900">
                  {plan.price}
                </span>
                <span className="text-xs text-zinc-600">{plan.period}</span>
              </div>
              <p className="mt-2 text-xs text-zinc-600">{plan.description}</p>
              <PlanButton
                plan={plan}
                variant={plan.popular ? "default" : "outline"}
                className="mt-5 w-full"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
