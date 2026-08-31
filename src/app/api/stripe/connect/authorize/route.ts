import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPlatformStripeClient } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/app-url";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createConnectState } from "@/lib/stripe-connect-state";

/**
 * Punto di ingresso del bottone "Connetti con Stripe"
 * (src/components/dashboard/stripe-connect-card.tsx): redirige alla pagina
 * di autorizzazione OAuth Standard Connect ospitata da Stripe. Il callback è
 * src/app/api/stripe/connect/callback/route.ts.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", getAppBaseUrl()));
  }

  const { allowed } = checkRateLimit(`stripe-connect-authorize:${getClientIp(request)}`, 5, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Troppe richieste. Riprova tra qualche minuto." }, { status: 429 });
  }

  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  // TODO(debug temporaneo): rimuovere dopo aver diagnosticato "No application
  // matches the supplied client identifier" — non logga il valore completo.
  console.log(
    `[stripe-connect][debug] client_id prefix=${clientId?.slice(0, 7) ?? "undefined"} length=${clientId?.length ?? 0}`
  );
  if (!clientId) {
    console.error("[stripe-connect] STRIPE_CONNECT_CLIENT_ID non configurato.");
    return NextResponse.json(
      { error: "Integrazione Stripe Connect non ancora configurata." },
      { status: 500 }
    );
  }

  const stripe = await getPlatformStripeClient();
  const state = createConnectState(session.user.id);
  const authorizeUrl = stripe.oauth.authorizeUrl({
    response_type: "code",
    client_id: clientId,
    scope: "read_write",
    redirect_uri: `${getAppBaseUrl()}/api/stripe/connect/callback`,
    state,
  });

  return NextResponse.redirect(authorizeUrl);
}
