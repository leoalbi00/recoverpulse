import { NextResponse } from "next/server";

import { getPlatformStripeClient } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/app-url";
import { verifyConnectState } from "@/lib/stripe-connect-state";
import {
  clearStripeAccountForUser,
  getUserIdForStripeAccount,
  setStripeAccountIdForUser,
  upsertConnectedStripeAccount,
} from "@/lib/connected-stripe-accounts";

export const dynamic = "force-dynamic";

/**
 * Callback OAuth Standard Connect: scambia il `code` per un access_token
 * scoped sull'account collegato e lo salva. Vedi
 * src/app/api/stripe/connect/authorize/route.ts per l'avvio del flusso.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const settingsUrl = `${getAppBaseUrl()}/dashboard/impostazioni`;

  if (oauthError) {
    console.warn(`[stripe-connect] autorizzazione annullata o rifiutata su Stripe: ${oauthError}`);
    return NextResponse.redirect(`${settingsUrl}?connected=cancelled`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?connected=error`);
  }

  const verified = verifyConnectState(state);
  if (!verified) {
    console.error("[stripe-connect] state OAuth mancante, non valido o scaduto.");
    return NextResponse.redirect(`${settingsUrl}?connected=error`);
  }

  try {
    const stripe = await getPlatformStripeClient();
    const token = await stripe.oauth.token({ grant_type: "authorization_code", code });

    if (!token.stripe_user_id || !token.access_token) {
      throw new Error("Risposta OAuth Stripe incompleta: stripe_user_id o access_token mancanti.");
    }

    // Trasferimento silenzioso di proprietà: se questo Stripe account era già
    // collegato a un altro utente RecoverPulse, gli viene tolto il
    // collegamento prima di riassegnarlo. trial_started_at non viene mai
    // toccato da upsertConnectedStripeAccount, quindi la prova resta quella
    // originale indipendentemente da chi possiede l'account ora.
    const previousOwnerId = await getUserIdForStripeAccount(token.stripe_user_id);
    if (previousOwnerId && previousOwnerId !== verified.userId) {
      await clearStripeAccountForUser(previousOwnerId);
    }

    await upsertConnectedStripeAccount({
      stripeAccountId: token.stripe_user_id,
      userId: verified.userId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      publishableKey: token.stripe_publishable_key,
      scope: token.scope,
      livemode: token.livemode ?? false,
    });

    await setStripeAccountIdForUser(verified.userId, token.stripe_user_id);

    return NextResponse.redirect(`${settingsUrl}?connected=success`);
  } catch (error) {
    console.error("[stripe-connect] errore nello scambio del codice OAuth:", error);
    return NextResponse.redirect(`${settingsUrl}?connected=error`);
  }
}
