import "server-only";

// Client REST per l'API PayPal (Subscriptions + verifica webhook), usato da:
// - src/app/api/v1/webhooks/paypal/[apiKey]/route.ts (verifica firma evento)
// - src/app/api/update-payment/[token]/confirm/route.ts (verifica stato subscription dopo la revise sul portale)
//
// A differenza della versione precedente (credenziali Client ID/Secret
// incollate a mano dal merchant, con grant_type=client_credentials), le
// funzioni qui sotto operano direttamente con l'access_token "third-party"
// ottenuto dall'onboarding OAuth Partner (src/lib/paypal-partner.ts) e
// salvato cifrato in paypal_settings (src/lib/paypal-settings.ts) — nessuno
// scambio di credenziali avviene più in questo modulo.

export type PaypalEnvironment = "live" | "sandbox";

const PAYPAL_API_BASES: Record<PaypalEnvironment, string> = {
  live: "https://api-m.paypal.com",
  sandbox: "https://api-m.sandbox.paypal.com",
};

/**
 * Legge PAYPAL_ENV (default "live"): quale ambiente usare per le NUOVE
 * connessioni Partner (src/lib/paypal-partner.ts). L'ambiente di una
 * connessione già esistente resta invece quello salvato al momento del
 * collegamento (paypal_settings.environment), così cambiare questa variabile
 * non rompe i merchant già collegati in un ambiente diverso.
 */
export function resolvePaypalEnvironment(): PaypalEnvironment {
  const raw = process.env.PAYPAL_ENV?.trim().toLowerCase();
  if (!raw || raw === "live") return "live";
  if (raw === "sandbox") return "sandbox";
  throw new Error(`PAYPAL_ENV non valido: "${raw}" (atteso "live" o "sandbox").`);
}

export function getPaypalApiBase(environment: PaypalEnvironment): string {
  return PAYPAL_API_BASES[environment];
}

export type PaypalWebhookHeaders = {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
};

/**
 * Verifica l'autenticità di un evento webhook in arrivo tramite l'endpoint
 * ufficiale PayPal /v1/notifications/verify-webhook-signature, l'equivalente
 * PayPal della verifica firma HMAC di Stripe (src/app/api/webhooks/stripe/route.ts).
 * `accessToken` è quello del merchant (src/lib/paypal-partner.ts,
 * getValidPaypalAccessToken). `webhookEvent` è il body JSON grezzo ricevuto,
 * così com'è.
 */
export async function verifyPaypalWebhookSignature(
  accessToken: string,
  webhookId: string,
  headers: PaypalWebhookHeaders,
  webhookEvent: unknown,
  environment: PaypalEnvironment
): Promise<boolean> {
  const response = await fetch(`${getPaypalApiBase(environment)}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers.authAlgo,
      cert_url: headers.certUrl,
      transmission_id: headers.transmissionId,
      transmission_sig: headers.transmissionSig,
      transmission_time: headers.transmissionTime,
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    }),
  });

  if (!response.ok) {
    throw new Error(`Verifica firma webhook PayPal non riuscita (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

export type PaypalSubscription = {
  id: string;
  status: string;
  subscriber?: {
    email_address?: string;
    payer_id?: string;
    name?: { given_name?: string; surname?: string };
  };
  billing_info?: {
    outstanding_balance?: { value: string; currency_code: string };
    last_payment?: { amount?: { value: string; currency_code: string } };
  };
};

/** Usata da /api/update-payment/[token]/confirm per verificare, lato server, che la subscription sia davvero tornata attiva prima di segnare la fattura come recuperata. */
export async function getPaypalSubscription(
  accessToken: string,
  subscriptionId: string,
  environment: PaypalEnvironment
): Promise<PaypalSubscription> {
  const response = await fetch(`${getPaypalApiBase(environment)}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Recupero subscription PayPal ${subscriptionId} non riuscito (HTTP ${response.status}).`);
  }

  return (await response.json()) as PaypalSubscription;
}
