import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MerchantSettingsPanel } from "@/components/dashboard/merchant-settings-panel";
import { StripeConnectCard } from "@/components/dashboard/stripe-connect-card";
import { SubscriptionCard } from "@/components/dashboard/subscription-card";
import { SubscriptionOverviewPanel } from "@/components/dashboard/subscription-overview-panel";
import { PlanButton } from "@/components/billing/plan-button";
import { getMerchantSettings, isMerchantProfileComplete } from "@/lib/merchant-settings";
import { getConnectedAccountForUser } from "@/lib/connected-stripe-accounts";
import { getBillingInfoForUser } from "@/lib/billing";
import { getSubscriptionOverview } from "@/lib/subscription-overview";
import { getTrialStatus } from "@/lib/trial";
import { listTransactions, type FailedTransaction } from "@/lib/transactions";
import { computePlanRecommendation } from "@/lib/plan-recommendation";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

function isPlanId(value: string | null): value is PlanId {
  return value !== null && PLANS.some((plan) => plan.id === value);
}

export default async function ImpostazioniPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const merchantSettings = await getMerchantSettings(session.user.id);
  const connectedAccount = await getConnectedAccountForUser(session.user.id).catch((error) => {
    console.error("[impostazioni] errore nel recupero dell'account Stripe collegato:", error);
    return null;
  });

  const billingInfo = await getBillingInfoForUser(session.user.id);
  const hasActiveSubscription =
    billingInfo.subscriptionStatus === "active" || billingInfo.subscriptionStatus === "trialing";
  const subscriptionOverview = await getSubscriptionOverview(session.user.id);

  const trial = await getTrialStatus(session.user.id);
  let transactions: FailedTransaction[] = [];
  try {
    transactions = await listTransactions(session.user.id);
  } catch (error) {
    console.error("[impostazioni] errore nel recupero delle transazioni:", error);
  }
  const currentPlanId = isPlanId(billingInfo.subscriptionPlan) ? billingInfo.subscriptionPlan : null;
  const planRecommendation = computePlanRecommendation(transactions, trial, currentPlanId);

  const profileComplete = isMerchantProfileComplete(merchantSettings);
  const currentPlanName = PLANS.find((plan) => plan.id === billingInfo.subscriptionPlan)?.name ?? null;

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Impostazioni
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Collega Stripe, i dati aziendali e gestisci l&apos;abbonamento a
          RecoverPulse.
        </p>
      </div>

      {!profileComplete && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold text-rose-100">
                Completa i dati aziendali obbligatori
              </p>
              <p className="mt-0.5 text-xs text-rose-200/80">
                Nome azienda, email aziendale e numero di telefono sono
                richiesti per completare il profilo.
              </p>
            </div>
          </div>
          <a
            href="#profilo-azienda"
            className="shrink-0 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-100 transition-colors hover:bg-rose-500/30"
          >
            Completa ora
          </a>
        </div>
      )}

      <Accordion multiple defaultValue={["brand"]} className="mt-8 flex flex-col gap-4">
        <AccordionItem
          id="profilo-azienda"
          value="brand"
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5"
        >
          <AccordionTrigger className="py-4 text-zinc-100">
            <div className="flex items-center gap-2">
              Profilo &amp; Brand Aziendale
              {!profileComplete && (
                <Badge className="h-auto bg-rose-500/20 px-2 py-0.5 text-rose-200">
                  Dati incompleti
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-xs text-zinc-400">
              Nome azienda, email aziendale e telefono (obbligatori), più logo
              e colore mostrati nelle email di sollecito e nel portale di
              aggiornamento carta.
            </p>
            <div className="mt-3">
              <MerchantSettingsPanel initialSettings={merchantSettings} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="stripe" className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5">
          <AccordionTrigger className="py-4 text-zinc-100">Account Stripe</AccordionTrigger>
          <AccordionContent>
            <p className="text-xs text-zinc-400">
              Nessuna chiave da incollare né webhook da configurare a mano: un
              click autorizza RecoverPulse a leggere i pagamenti falliti del
              tuo account e a intervenire per te.
            </p>
            <div className="mt-3">
              <StripeConnectCard
                connected={connectedAccount !== null}
                stripeAccountId={connectedAccount?.stripeAccountId ?? null}
                livemode={connectedAccount?.livemode ?? null}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="subscription" className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5">
          <AccordionTrigger className="py-4 text-zinc-100">Abbonamento</AccordionTrigger>
          <AccordionContent>
            <p className="text-xs text-zinc-400">
              Stato del piano, prossimo rinnovo, fatture e un consiglio su
              upgrade/downgrade in base al volume gestito.
            </p>
            <div className="mt-3">
              <SubscriptionCard
                hasSubscription={hasActiveSubscription}
                planName={currentPlanName}
              />
            </div>
            <div className="mt-5">
              <SubscriptionOverviewPanel
                hasActiveSubscription={hasActiveSubscription}
                planName={currentPlanName}
                overview={subscriptionOverview}
                recommendation={planRecommendation}
              />
            </div>
            <div className="mt-5 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "flex h-full flex-col rounded-xl border border-zinc-200/80 bg-white text-zinc-900 p-6 shadow-md",
                    plan.popular && "ring-2 ring-emerald-500/50",
                    plan.id === planRecommendation.recommendedPlanId &&
                      planRecommendation.action !== "keep" &&
                      "ring-2 ring-amber-500/60",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-900">
                      {plan.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {plan.id === planRecommendation.recommendedPlanId &&
                        planRecommendation.action !== "keep" && (
                          <Badge className="h-auto bg-amber-100 px-2 py-0.5 text-amber-800">
                            Consigliato per te
                          </Badge>
                        )}
                      {plan.popular && (
                        <Badge className="h-auto px-2 py-0.5">Consigliato</Badge>
                      )}
                    </div>
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
