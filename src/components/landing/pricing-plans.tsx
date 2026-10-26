"use client";

import { useState } from "react";
import BigNumber from "bignumber.js";
import { Check, Percent, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

type BillingPeriod = "monthly" | "yearly";

// Sconto della fatturazione annuale, applicato al canone mensile di listino.
const YEARLY_DISCOUNT = "0.2";

/** Canone mensile in dollari (dai centesimi di listino), scontato se annuale; arrotondato al centesimo. */
function monthlyPrice(priceInCents: number, period: BillingPeriod): number {
  const cents = new BigNumber(priceInCents);
  const discounted = period === "yearly" ? cents.times(new BigNumber(1).minus(YEARLY_DISCOUNT)) : cents;
  return discounted.dividedBy(100).decimalPlaces(2, BigNumber.ROUND_HALF_EVEN).toNumber();
}

function yearlyTotal(priceInCents: number): number {
  return new BigNumber(monthlyPrice(priceInCents, "yearly")).times(12).toNumber();
}

const PRICE_FORMAT = {
  style: "currency",
  currency: "USD",
  trailingZeroDisplay: "stripIfInteger",
} as const satisfies Intl.NumberFormatOptions;

/**
 * Card dei piani con toggle mensile/annuale. Durante la Beta i piani a
 * pagamento sono un'anteprima non acquistabile (CTA disabilitata), come
 * comunicato nella sezione Prezzi (pricing.tsx).
 */
export function PricingPlans() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <div>
      <div className="flex justify-center">
        <div
          role="radiogroup"
          aria-label="Periodo di fatturazione"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1"
        >
          {(
            [
              { id: "monthly", label: "Mensile" },
              { id: "yearly", label: "Annuale" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={period === option.id}
              onClick={() => setPeriod(option.id)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:outline-none",
                period === option.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
              {option.id === "yearly" && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                    period === "yearly" ? "bg-emerald-500 text-emerald-950" : "bg-emerald-500/15 text-emerald-700"
                  )}
                >
                  −20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div key={plan.id} className="relative h-full">
            {plan.popular && (
              <Badge className="absolute top-0 left-1/2 z-10 h-auto -translate-x-1/2 -translate-y-1/2 gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-white shadow-md shadow-emerald-600/20">
                <Sparkles className="size-3.5" />
                Consigliato
              </Badge>
            )}

            <div
              className={cn(
                "flex h-full flex-col rounded-2xl border p-8 shadow-xl shadow-slate-900/5",
                plan.popular
                  ? "border-emerald-600/40 bg-gradient-to-b from-emerald-50 to-card ring-1 ring-emerald-600/30"
                  : "border-border bg-card"
              )}
            >
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>

              <div className="mt-8 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight text-foreground">
                  {new Intl.NumberFormat("en-US", PRICE_FORMAT).format(monthlyPrice(plan.priceInCents, period))}
                </span>
                <span className="text-sm text-muted-foreground">/mese</span>
              </div>
              <p className="mt-1 h-5 text-xs text-muted-foreground">
                {period === "yearly"
                  ? `${new Intl.NumberFormat("en-US", PRICE_FORMAT).format(yearlyTotal(plan.priceInCents))} fatturati annualmente`
                  : "Fatturazione mensile, disdici quando vuoi"}
              </p>

              <p className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-slate-700">
                <Percent className="size-3.5 shrink-0 text-emerald-700" />
                0% di commissione sul fatturato recuperato
              </p>

              <Button
                size="lg"
                type="button"
                disabled
                variant={plan.popular ? "default" : "outline"}
                className="mt-6 h-12 w-full rounded-full text-base font-semibold"
              >
                Disponibile dopo la Beta
              </Button>

              <ul className="mt-8 flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
