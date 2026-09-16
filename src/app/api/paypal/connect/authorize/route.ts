import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAppBaseUrl } from "@/lib/app-url";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createConnectState } from "@/lib/oauth-connect-state";
import { createPartnerReferralUrl } from "@/lib/paypal-partner";
import { resolvePaypalEnvironment } from "@/lib/paypal";

export const dynamic = "force-dynamic";

/**
 * Punto di ingresso del pulsante "Connetti PayPal (1-Click)"
 * (src/components/dashboard/paypal-settings-panel.tsx): genera l'URL di
 * onboarding Partner Referrals e reindirizza il merchant su PayPal. Il
 * callback è src/app/api/paypal/connect/callback/route.ts. Stesso schema di
 * route (/api/<provider>/connect/{authorize,callback}) già usato da Stripe
 * Connect (src/app/api/stripe/connect/authorize/route.ts).
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", getAppBaseUrl()));
  }

  const { allowed } = checkRateLimit(`paypal-connect-authorize:${getClientIp(request)}`, 5, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Troppe richieste. Riprova tra qualche minuto." }, { status: 429 });
  }

  const state = createConnectState("paypal", session.user.id);

  try {
    const actionUrl = await createPartnerReferralUrl(state, resolvePaypalEnvironment());
    return NextResponse.redirect(actionUrl);
  } catch (error) {
    console.error("[paypal-connect] errore nella generazione dell'URL di onboarding:", error);
    return NextResponse.json({ error: "Integrazione PayPal Partner non ancora configurata." }, { status: 500 });
  }
}
