export type PlanId = "starter" | "growth" | "scale";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  priceInCents: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  /** Fatture fallite/mese coperte dal piano (vedi features sopra); null = illimitate. Usata dal recommendation engine, src/lib/plan-recommendation.ts. */
  monthlyFailedInvoiceLimit: number | null;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$39",
    priceInCents: 3900,
    period: "/mese",
    description: "Per piccoli team che vogliono iniziare a recuperare pagamenti falliti.",
    features: [
      "Fino a 100 fatture fallite/mese",
      "Dunning via Email",
      "Portale 1-Click aggiornamento carta",
      "Dashboard Analytics",
      "Supporto via email",
    ],
    monthlyFailedInvoiceLimit: 100,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$89",
    priceInCents: 8900,
    period: "/mese",
    description: "Per SaaS in crescita che vogliono un dunning multi-canale completo.",
    features: [
      "Tutto di Starter",
      "Dunning multi-canale: WhatsApp + SMS + Email",
      "Fino a 500 fatture fallite/mese",
      "Analytics MRR in tempo reale",
      "Sequenze dunning personalizzabili",
      "Supporto prioritario",
    ],
    popular: true,
    monthlyFailedInvoiceLimit: 500,
  },
  {
    id: "scale",
    name: "Scale",
    price: "$199",
    priceInCents: 19900,
    period: "/mese",
    description: "Per aziende con alti volumi che hanno bisogno di controllo e supporto dedicato.",
    features: [
      "Tutto di Growth",
      "Fatture fallite illimitate",
      "Multi-account Stripe",
      "Accesso API",
      "Account manager dedicato",
      "SLA e supporto white-glove",
    ],
    monthlyFailedInvoiceLimit: null,
  },
];
