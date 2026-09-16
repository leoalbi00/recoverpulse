import "server-only";

// Client REST per l'API PayPal (Subscriptions + verifica webhook), usato da:
// - src/app/api/v1/webhooks/paypal/[apiKey]/route.ts (verifica firma evento)
// - src/app/api/update-payment/[token]/confirm/route.ts (verifica stato subscription dopo la revise sul portale)
//
// v1: solo ambiente live (api-m.paypal.com), coerente con l'approccio già
// seguito per Stripe in questo progetto.
//
// A differenza della versione precedente (credenziali Client ID/Secret
// incollate a mano dal merchant, con grant_type=client_credentials), le
// funzioni qui sotto operano direttamente con l'access_token "third-party"
// ottenuto dall'onboarding OAuth Partner (src/lib/paypal-partner.ts) e
// salvato cifrato in paypal_settings (src/lib/paypal-settings.ts) — nessuno
// scambio di credenziali avviene più in questo modulo.
const PAYPAL_API_BASE = "https://api-m.paypal.com";

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
  webhookEvent: unknown
): Promise<boolean> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
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
export async function getPaypalSubscription(accessToken: string, subscriptionId: string): Promise<PaypalSubscription> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Recupero subscription PayPal ${subscriptionId} non riuscito (HTTP ${response.status}).`);
  }

  return (await response.json()) as PaypalSubscription;
}
