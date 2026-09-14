import "server-only";

// Client REST per l'API PayPal (Subscriptions + verifica webhook), usato da:
// - src/app/api/v1/webhooks/paypal/[apiKey]/route.ts (verifica firma evento)
// - src/app/api/dashboard/paypal-settings/route.ts (test credenziali al salvataggio)
// - src/app/api/update-payment/[token]/confirm/route.ts (verifica stato subscription dopo la revise sul portale)
//
// v1: solo ambiente live (api-m.paypal.com), coerente con l'approccio già
// seguito per Stripe in questo progetto (nessuna distinzione sandbox/live
// nel codice — è il merchant a scegliere quali credenziali PayPal incollare).
const PAYPAL_API_BASE = "https://api-m.paypal.com";

type PaypalCredentials = { clientId: string; clientSecret: string };

async function getAccessToken({ clientId, clientSecret }: PaypalCredentials): Promise<string> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Autenticazione PayPal non riuscita (HTTP ${response.status}): credenziali non valide?`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Risposta PayPal senza access_token.");
  }
  return data.access_token;
}

/** Usata dal pulsante "Collega Account PayPal": valida Client ID/Secret prima di salvarli. */
export async function testPaypalCredentials(credentials: PaypalCredentials): Promise<void> {
  await getAccessToken(credentials);
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
 * `webhookEvent` è il body JSON grezzo ricevuto, così com'è.
 */
export async function verifyPaypalWebhookSignature(
  credentials: PaypalCredentials,
  webhookId: string,
  headers: PaypalWebhookHeaders,
  webhookEvent: unknown
): Promise<boolean> {
  const accessToken = await getAccessToken(credentials);

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
export async function getPaypalSubscription(
  credentials: PaypalCredentials,
  subscriptionId: string
): Promise<PaypalSubscription> {
  const accessToken = await getAccessToken(credentials);

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Recupero subscription PayPal ${subscriptionId} non riuscito (HTTP ${response.status}).`);
  }

  return (await response.json()) as PaypalSubscription;
}
