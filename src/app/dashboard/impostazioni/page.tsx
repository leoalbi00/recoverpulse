import { headers } from "next/headers";
import { Webhook } from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { CopyField } from "@/components/dashboard/copy-field";
import { IntegrationKeysPanel } from "@/components/dashboard/integration-keys-panel";
import { SubscriptionCard } from "@/components/dashboard/subscription-card";
import { PlanButton } from "@/components/billing/plan-button";
import { getIntegrationSettings, maskSecret } from "@/lib/integration-settings";
import { getStripeCustomerForUser } from "@/lib/billing";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

const WEBHOOK_EVENTS = ["invoice.payment_failed", "invoice.payment_succeeded", "checkout.session.completed"];

export default async function ImpostazioniPage() {
  const session = await auth();
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const webhookUrl = `${protocol}://${host}/api/webhooks/stripe`;

  const settings = getIntegrationSettings();
  const keysStatus = {
    stripeSecretKey: {
      configured: settings.stripeSecretKey.length > 0,
      masked: maskSecret(settings.stripeSecretKey),
    },
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

  const hasSubscription = session?.user ? getStripeCustomerForUser(session.user.id) !== null : false;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Impostazioni
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Collega Stripe, i tuoi canali di notifica e gestisci l&apos;abbonamento a RecoverPulse.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-300">Webhook Stripe</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Incolla questo URL in Stripe (Sviluppatori → Webhook) e seleziona gli eventi elencati sotto.
        </p>
        <div className="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Webhook className="size-4 text-emerald-500" />
            </span>
            <p className="text-sm font-medium text-zinc-100">URL Endpoint</p>
          </div>
          <div className="mt-4">
            <CopyField value={webhookUrl} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {WEBHOOK_EVENTS.map((eventName) => (
              <Badge key={eventName} variant="outline" className="h-auto border-zinc-800 bg-zinc-950/60 px-2 py-1 font-mono text-[11px] text-zinc-400">
                {eventName}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-zinc-300">Chiavi API</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Collega i tuoi provider per attivare i canali dunning e la sincronizzazione con Stripe.
        </p>
        <div className="mt-3">
          <IntegrationKeysPanel initialStatus={keysStatus} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-zinc-300">Piano &amp; Fatturazione</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Gestisci l&apos;abbonamento corrente o passa a un piano con più volumi e canali dunning.
        </p>
        <div className="mt-3">
          <SubscriptionCard hasSubscription={hasSubscription} />
        </div>
        <div className="mt-5 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex h-full flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur-sm",
                plan.popular && "ring-2 ring-emerald-500/50"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-100">{plan.name}</p>
                {plan.popular && <Badge className="h-auto px-2 py-0.5">Consigliato</Badge>}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-zinc-100">{plan.price}</span>
                <span className="text-xs text-zinc-500">{plan.period}</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">{plan.description}</p>
              <PlanButton
                plan={plan}
                variant={plan.popular ? "default" : "outline"}
                className="mt-5 w-full"
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
