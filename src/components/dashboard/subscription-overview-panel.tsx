import { Calendar, Lightbulb } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/plans";
import type { PlanRecommendation } from "@/lib/plan-recommendation";
import type { SubscriptionOverview } from "@/lib/subscription-overview";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

const INVOICE_STATUS_LABEL: Record<string, string> = {
  paid: "Pagata",
  open: "In attesa",
  draft: "Bozza",
  uncollectible: "Non incassabile",
  void: "Annullata",
};

const INVOICE_STATUS_CLASS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  open: "bg-amber-100 text-amber-800",
  draft: "bg-zinc-100 text-zinc-700",
  uncollectible: "bg-rose-100 text-rose-800",
  void: "bg-zinc-100 text-zinc-500",
};

const RECOMMENDATION_COPY: Record<PlanRecommendation["action"], (planName: string) => string> = {
  upgrade: (planName) =>
    `Il volume gestito ha superato la soglia del piano attuale: ti consigliamo di passare a ${planName}.`,
  downgrade: (planName) =>
    `Il volume gestito è ben sotto la soglia del piano attuale: potresti risparmiare passando a ${planName}.`,
  keep: () => "Il piano attuale copre bene il volume gestito: nessun cambio consigliato per ora.",
};

/**
 * Contenuto del pannello Accordion "Abbonamento" in /dashboard/impostazioni:
 * stato del piano + data di rinnovo/scadenza + fatture (da Stripe, vedi
 * src/lib/subscription-overview.ts) e il box "Consiglio Abbonamento
 * RecoverPulse" (src/lib/plan-recommendation.ts). Puramente presentazionale:
 * nessuna interattività, quindi resta un Server Component come il resto
 * della pagina.
 */
export function SubscriptionOverviewPanel({
  hasActiveSubscription,
  planName,
  overview,
  recommendation,
}: {
  hasActiveSubscription: boolean;
  planName: string | null;
  overview: SubscriptionOverview;
  recommendation: PlanRecommendation;
}) {
  const recommendedPlan = PLANS.find((plan) => plan.id === recommendation.recommendedPlanId);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-zinc-200/80 bg-white p-5 text-zinc-900 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Calendar className="size-4 text-zinc-500" />
          <span className="font-medium text-zinc-900">
            {hasActiveSubscription
              ? overview.renewsAt
                ? `${overview.cancelAtPeriodEnd ? "Scade" : "Prossimo rinnovo"} il ${formatDate(overview.renewsAt)}`
                : "Data di rinnovo non disponibile"
              : "Nessun abbonamento attivo"}
          </span>
          {overview.cancelAtPeriodEnd && (
            <Badge className="h-auto bg-amber-100 px-2 py-0.5 text-amber-800">
              Cancellazione programmata
            </Badge>
          )}
        </div>

        {overview.invoices.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200/80 text-xs uppercase tracking-wide text-zinc-600">
                  <th className="px-3 pb-2 font-medium first:pl-0">Data</th>
                  <th className="px-3 pb-2 font-medium">Importo</th>
                  <th className="px-3 pb-2 font-medium">Stato</th>
                  <th className="px-3 pb-2 text-right font-medium last:pr-0">Fattura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {overview.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-3 py-2.5 text-zinc-700 first:pl-0">{formatDate(invoice.createdAt)}</td>
                    <td className="px-3 py-2.5 font-medium text-zinc-900">
                      {formatAmount(invoice.amount, invoice.currency)}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        className={cn(
                          "h-auto px-2 py-0.5",
                          INVOICE_STATUS_CLASS[invoice.status] ?? "bg-zinc-100 text-zinc-700",
                        )}
                      >
                        {INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right last:pr-0">
                      {invoice.hostedInvoiceUrl ? (
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:text-emerald-500"
                        >
                          Apri
                        </a>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <Lightbulb className="size-4" />
          Consiglio Abbonamento RecoverPulse
        </div>
        <p className="mt-2 text-sm text-zinc-700">
          Hai gestito <strong>{recommendation.volume}</strong> fatture fallite {recommendation.windowLabel}
          {planName ? ` sul piano ${planName}` : ""}.
        </p>
        <p className="mt-1.5 text-sm text-zinc-700">
          {RECOMMENDATION_COPY[recommendation.action](recommendedPlan?.name ?? recommendation.recommendedPlanId)}
        </p>
      </div>
    </div>
  );
}
