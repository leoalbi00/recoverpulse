import { NextResponse } from "next/server";

import { getAppBaseUrl } from "@/lib/app-url";
import { verifyConnectState } from "@/lib/oauth-connect-state";
import { exchangeAuthorizationCode, getOrganisation, resolveGoCardlessEnvironment } from "@/lib/gocardless";
import { upsertConnectedGoCardlessAccount } from "@/lib/connected-gocardless-accounts";

export const dynamic = "force-dynamic";

/**
 * Callback OAuth2 GoCardless: scambia l'authorization code per un
 * access_token scoped sull'organisation del merchant e lo salva cifrato. Vedi
 * src/app/api/gocardless/connect/authorize/route.ts per l'avvio del flusso.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const settingsUrl = `${getAppBaseUrl()}/dashboard/impostazioni`;

  if (oauthError) {
    console.warn(`[gocardless-connect] autorizzazione annullata o rifiutata: ${oauthError}`);
    return NextResponse.redirect(`${settingsUrl}?provider=gocardless&connected=cancelled#metodi-pagamento`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?provider=gocardless&connected=error#metodi-pagamento`);
  }

  const verified = verifyConnectState("gocardless", state);
  if (!verified) {
    console.error("[gocardless-connect] state OAuth mancante, non valido o scaduto.");
    return NextResponse.redirect(`${settingsUrl}?provider=gocardless&connected=error#metodi-pagamento`);
  }

  try {
    const environment = resolveGoCardlessEnvironment();
    const redirectUri = `${getAppBaseUrl()}/api/gocardless/connect/callback`;
    const tokens = await exchangeAuthorizationCode(code, redirectUri, environment);
    if (!tokens.organisationId) {
      throw new Error("Risposta GoCardless senza organisation_id.");
    }

    const organisation = await getOrganisation(tokens.accessToken, tokens.organisationId, environment);

    await upsertConnectedGoCardlessAccount({
      organisationId: tokens.organisationId,
      userId: verified.userId,
      accessToken: tokens.accessToken,
      organisationName: organisation.name,
      environment,
    });

    // Il webhook GoCardless è "universale" per design del prodotto: si
    // registra UNA VOLTA SOLA nel Dashboard Partner GoCardless (Developers →
    // Webhook endpoints), non per singola organisation via API — a
    // differenza di Stripe/PayPal, GoCardless non espone un endpoint REST
    // per la registrazione webhook per conto terzi. Da quel momento riceve
    // gli eventi di TUTTE le organisation collegate via OAuth, distinte dal
    // campo links.organisation di ogni evento (vedi
    // src/app/api/v1/webhooks/gocardless/route.ts).

    return NextResponse.redirect(`${settingsUrl}?provider=gocardless&connected=success#metodi-pagamento`);
  } catch (error) {
    console.error("[gocardless-connect] errore nel completamento del collegamento GoCardless:", error);
    return NextResponse.redirect(`${settingsUrl}?provider=gocardless&connected=error#metodi-pagamento`);
  }
}
