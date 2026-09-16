import { NextResponse } from "next/server";

import { getAppBaseUrl } from "@/lib/app-url";
import { verifyConnectState } from "@/lib/oauth-connect-state";
import { exchangeAuthorizationCode, getMerchantIdentity, registerMerchantWebhook } from "@/lib/paypal-partner";
import { resolvePaypalEnvironment } from "@/lib/paypal";
import { savePaypalConnection } from "@/lib/paypal-settings";
import { getOrCreateMerchantApiKey } from "@/lib/merchant-api-keys";

export const dynamic = "force-dynamic";

/**
 * Callback OAuth Partner Referrals: riceve l'authorization code dal redirect
 * di ritorno PayPal, lo scambia per un access/refresh token scoped sul
 * merchant, registra in automatico il webhook universale
 * (/api/v1/webhooks/paypal/[apiKey]) e salva le credenziali cifrate in
 * paypal_settings. Vedi src/app/api/paypal/connect/authorize/route.ts per
 * l'avvio del flusso.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const consentStatus = url.searchParams.get("consentStatus");

  const settingsUrl = `${getAppBaseUrl()}/dashboard/impostazioni`;

  if (!code || !state) {
    const redirectStatus = consentStatus === "false" ? "cancelled" : "error";
    if (!code) {
      console.warn(`[paypal-connect] callback senza authorization code (consentStatus=${consentStatus ?? "n/d"}).`);
    }
    return NextResponse.redirect(`${settingsUrl}?provider=paypal&connected=${redirectStatus}#metodi-pagamento`);
  }

  const verified = verifyConnectState("paypal", state);
  if (!verified) {
    console.error("[paypal-connect] state OAuth mancante, non valido o scaduto.");
    return NextResponse.redirect(`${settingsUrl}?provider=paypal&connected=error#metodi-pagamento`);
  }

  try {
    const environment = resolvePaypalEnvironment();
    const tokens = await exchangeAuthorizationCode(code, environment);
    const identity = await getMerchantIdentity(tokens.accessToken, environment);

    const merchantApiKey = await getOrCreateMerchantApiKey(verified.userId);
    const webhookUrl = `${getAppBaseUrl()}/api/v1/webhooks/paypal/${merchantApiKey}`;
    const webhookId = await registerMerchantWebhook(tokens.accessToken, webhookUrl, environment);

    await savePaypalConnection(verified.userId, {
      merchantId:
        identity.merchantId ??
        url.searchParams.get("merchantIdInPayPal") ??
        url.searchParams.get("merchantId") ??
        "",
      email: identity.email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresInSeconds: tokens.expiresIn,
      webhookId,
      environment,
    });

    return NextResponse.redirect(`${settingsUrl}?provider=paypal&connected=success#metodi-pagamento`);
  } catch (error) {
    console.error("[paypal-connect] errore nel completamento del collegamento PayPal:", error);
    return NextResponse.redirect(`${settingsUrl}?provider=paypal&connected=error#metodi-pagamento`);
  }
}
