"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Plan } from "@/lib/plans";

type PlanButtonProps = {
  plan: Plan;
  variant?: "default" | "outline";
  className?: string;
  /**
   * Se presente, il pulsante diventa un semplice link (usato dalla Pricing
   * della landing page pubblica, src/components/landing/pricing.tsx): un
   * visitatore anonimo non ha un account a cui legare il checkout
   * (/api/checkout richiede una sessione), quindi lo instradiamo su
   * /start-trial per creare prima l'account, scegliendo poi il piano da
   * /dashboard/impostazioni. Senza questa prop il pulsante avvia il
   * checkout reale (comportamento invariato per l'uso in dashboard).
   */
  href?: string;
};

export function PlanButton({ plan, variant = "outline", className, href }: PlanButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (href) {
    return (
      <Button size="lg" type="button" render={<a href={href} />} variant={variant} className={className}>
        Scegli Piano
      </Button>
    );
  }

  async function handleCheckout() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? "Errore durante il checkout.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il checkout.");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        size="lg"
        type="button"
        disabled={loading}
        onClick={handleCheckout}
        variant={variant}
        className={className}
      >
        {loading ? "Reindirizzamento..." : "Scegli Piano"}
      </Button>
      {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}
    </div>
  );
}
