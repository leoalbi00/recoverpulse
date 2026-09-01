import "server-only";

import { getPlatformStripeClient } from "@/lib/stripe";
import { getStripeCustomerForUser } from "@/lib/billing";

export type SubscriptionInvoice = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  hostedInvoiceUrl: string | null;
};

export type SubscriptionOverview = {
  renewsAt: string | null;
  cancelAtPeriodEnd: boolean;
  invoices: SubscriptionInvoice[];
};

const EMPTY_OVERVIEW: SubscriptionOverview = {
  renewsAt: null,
  cancelAtPeriodEnd: false,
  invoices: [],
};

/**
 * Dettaglio dell'abbonamento SaaS RecoverPulse (data di prossimo rinnovo +
 * ultime fatture) letto live dall'account piattaforma Stripe invece che da
 * Supabase: `users.subscription_status/plan` (src/lib/billing.ts) bastano
 * per il paywall ma non conservano rinnovo o storico fatture. Usata dal
 * pannello Accordion "Abbonamento" di /dashboard/impostazioni. Non lancia
 * mai: un errore Stripe qui non deve rompere il render dell'intera pagina.
 */
export async function getSubscriptionOverview(userId: string): Promise<SubscriptionOverview> {
  try {
    const customerId = await getStripeCustomerForUser(userId);
    if (!customerId) return EMPTY_OVERVIEW;

    const stripe = await getPlatformStripeClient();

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });
    const subscription = subscriptions.data[0] ?? null;
    const currentPeriodEnd = subscription?.items.data[0]?.current_period_end ?? null;

    const invoicesResponse = await stripe.invoices.list({ customer: customerId, limit: 5 });
    const invoices: SubscriptionInvoice[] = invoicesResponse.data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid || invoice.amount_due,
      currency: invoice.currency,
      status: invoice.status ?? "unknown",
      createdAt: new Date(invoice.created * 1000).toISOString(),
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    }));

    return {
      renewsAt: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
      invoices,
    };
  } catch (error) {
    console.error("[subscription-overview] errore nel recupero da Stripe:", error);
    return EMPTY_OVERVIEW;
  }
}
