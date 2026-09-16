import "server-only";

import { getAppBaseUrl } from "@/lib/app-url";
import { getPaypalSettings, updatePaypalTokens } from "@/lib/paypal-settings";

// PayPal Partner Referrals API: genera l'onboarding "Connetti PayPal
// (1-Click)" (src/components/dashboard/paypal-settings-panel.tsx) senza che
// il merchant debba mai creare una propria app PayPal REST o incollare
// Client ID/Secret — sostituisce il flusso manuale precedente
// (src/app/api/dashboard/paypal-settings/route.ts, rimosso).
const PAYPAL_API_BASE = "https://api-m.paypal.com";

function getPartnerCredentials(): { clientId: string; clientSecret: string; bnCode: string | null } {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_PARTNER_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_PARTNER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "NEXT_PUBLIC_PAYPAL_PARTNER_CLIENT_ID/PAYPAL_PARTNER_CLIENT_SECRET non configurati: integrazione PayPal Partner non disponibile."
    );
  }
  return { clientId, clientSecret, bnCode: process.env.PAYPAL_PARTNER_BN_CODE ?? null };
}

async function getPartnerAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getPartnerCredentials();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Autenticazione Partner PayPal non riuscita (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Risposta PayPal senza access_token (partner).");
  return data.access_token;
}

/**
 * Genera l'URL di onboarding Partner Referrals: il merchant viene reindirizzato
 * su una pagina ospitata da PayPal per collegare (o creare) il proprio
 * account e concedere i permessi, poi torna sul nostro callback con un
 * authorization code (integrazione THIRD_PARTY, vedi
 * "Get a third-party access token" nella documentazione PayPal REST).
 */
export async function createPartnerReferralUrl(state: string): Promise<string> {
  const { bnCode } = getPartnerCredentials();
  const accessToken = await getPartnerAccessToken();
  const returnUrl = `${getAppBaseUrl()}/api/paypal/connect/callback?state=${encodeURIComponent(state)}`;

  const response = await fetch(`${PAYPAL_API_BASE}/v2/customer/partner-referrals`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(bnCode ? { "PayPal-Partner-Attribution-Id": bnCode } : {}),
    },
    body: JSON.stringify({
      tracking_id: state,
      partner_config_override: {
        return_url: returnUrl,
        return_url_description: "Torna a OmniRev",
      },
      operations: [
        {
          operation: "API_INTEGRATION",
          api_integration_preference: {
            rest_api_integration: {
              integration_method: "PAYPAL",
              integration_type: "THIRD_PARTY",
              third_party_details: { features: ["PAYMENT", "REFUND", "PARTNER_FEE"] },
            },
          },
        },
      ],
      products: ["PPCP"],
      legal_consents: [{ type: "SHARE_DATA_CONSENT", granted: true }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Generazione URL onboarding PayPal Partner non riuscita (HTTP ${response.status}): ${detail}`);
  }

  const data = (await response.json()) as { links?: { rel: string; href: string }[] };
  const actionUrl = data.links?.find((link) => link.rel === "action_url")?.href;
  if (!actionUrl) throw new Error("Risposta PayPal Partner Referrals senza action_url.");
  return actionUrl;
}

export type PaypalPartnerTokens = { accessToken: string; refreshToken: string | null; expiresIn: number | null };

/** Scambia l'authorization code ricevuto nel redirect di ritorno con un access/refresh token scoped sul merchant. */
export async function exchangeAuthorizationCode(code: string): Promise<PaypalPartnerTokens> {
  const { clientId, clientSecret } = getPartnerCredentials();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=authorization_code&code=${encodeURIComponent(code)}`,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Scambio authorization code PayPal non riuscito (HTTP ${response.status}): ${detail}`);
  }

  const data = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Risposta PayPal senza access_token (scambio code).");

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in ?? null,
  };
}

export type PaypalMerchantIdentity = { merchantId: string | null; email: string | null };

/** Recupera identità (Payer ID/email) del merchant appena collegato, per salvarla accanto ai token. */
export async function getMerchantIdentity(accessToken: string): Promise<PaypalMerchantIdentity> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return { merchantId: null, email: null };

  const data = (await response.json()) as { payer_id?: string; user_id?: string; email?: string };
  return { merchantId: data.payer_id ?? data.user_id ?? null, email: data.email ?? null };
}

/** Registra in automatico il webhook universale PayPal per conto del merchant appena collegato (POST /v1/notifications/webhooks), con le credenziali del merchant stesso. */
export async function registerMerchantWebhook(accessToken: string, webhookUrl: string): Promise<string> {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/webhooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: webhookUrl,
      event_types: [{ name: "BILLING.SUBSCRIPTION.PAYMENT.FAILED" }, { name: "BILLING.SUBSCRIPTION.SUSPENDED" }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Registrazione webhook PayPal non riuscita (HTTP ${response.status}): ${detail}`);
  }

  const data = (await response.json()) as { id?: string };
  if (!data.id) throw new Error("Risposta PayPal senza id webhook.");
  return data.id;
}

/**
 * Restituisce un access_token PayPal valido per il merchant, rinnovandolo
 * in automatico tramite refresh_token se scaduto o in scadenza entro 5
 * minuti. Usata da ogni chiamata API "per conto" del merchant dopo il
 * collegamento iniziale (verifica webhook, lettura subscription).
 */
export async function getValidPaypalAccessToken(userId: string): Promise<string> {
  const settings = await getPaypalSettings(userId);
  if (!settings.accessToken) {
    throw new Error("Nessun account PayPal collegato per questo merchant.");
  }

  const expiresSoon = settings.tokenExpiresAt
    ? new Date(settings.tokenExpiresAt).getTime() - Date.now() < 5 * 60 * 1000
    : false;
  if (!expiresSoon || !settings.refreshToken) {
    return settings.accessToken;
  }

  const { clientId, clientSecret } = getPartnerCredentials();
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(settings.refreshToken)}`,
  });

  if (!response.ok) {
    console.error(`[paypal-partner] refresh token non riuscito per l'utente ${userId} (HTTP ${response.status}).`);
    return settings.accessToken;
  }

  const data = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!data.access_token) return settings.accessToken;

  await updatePaypalTokens(userId, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresInSeconds: data.expires_in ?? null,
  });

  return data.access_token;
}
