import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAppBaseUrl } from "@/lib/app-url";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createConnectState } from "@/lib/oauth-connect-state";
import { buildAuthorizeUrl, resolveGoCardlessEnvironment } from "@/lib/gocardless";

export const dynamic = "force-dynamic";

/**
 * Punto di ingresso del pulsante "Connetti SEPA / GoCardless (1-Click)"
 * (src/components/dashboard/gocardless-connect-card.tsx): reindirizza il
 * merchant all'autorizzazione OAuth2 dell'app Partner GoCardless. Il
 * callback è src/app/api/gocardless/connect/callback/route.ts.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", getAppBaseUrl()));
  }

  const { allowed } = checkRateLimit(`gocardless-connect-authorize:${getClientIp(request)}`, 5, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Troppe richieste. Riprova tra qualche minuto." }, { status: 429 });
  }

  const state = createConnectState("gocardless", session.user.id);

  try {
    const redirectUri = `${getAppBaseUrl()}/api/gocardless/connect/callback`;
    const authorizeUrl = buildAuthorizeUrl(state, redirectUri, resolveGoCardlessEnvironment());
    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    console.error("[gocardless-connect] errore nella generazione dell'URL di autorizzazione:", error);
    return NextResponse.json({ error: "Integrazione GoCardless non ancora configurata." }, { status: 500 });
  }
}
