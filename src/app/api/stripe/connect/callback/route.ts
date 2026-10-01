import { NextResponse } from "next/server";

import { getPlatformStripeClient } from "@/lib/stripe";
import { getAppBaseUrl } from "@/lib/app-url";
import { verifyConnectState } from "@/lib/stripe-connect-state";
import {
  clearStripeAccountForUser,
  getUserIdForStripeAccount,
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
    return NextResponse.redirect(`${settingsUrl}?provider=stripe&connected=cancelled#metodi-pagamento`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?provider=stripe&connected=error#metodi-pagamento`);
  }

  const verified = verifyConnectState(state);
  if (!verified) {
    console.error("[stripe-connect] state OAuth mancante, non valido o scaduto.");
    return NextResponse.redirect(`${settingsUrl}?provider=stripe&connected=error#metodi-pagamento`);
  }

  try {
    const stripe = await getPlatformStripeClient();
    const token = await stripe.oauth.token({ grant_type: "authorization_code", code });

    if (!token.stripe_user_id || !token.access_token) {
      throw new Error("Risposta OAuth Stripe incompleta: stripe_user_id o access_token mancanti.");
    }

    // Trasferimento silenzioso di proprietà: se questo Stripe account era già
    // collegato a un altro utente OmniRev, gli viene tolto il
    // collegamento prima di riassegnarlo. trial_started_at non viene mai
    // toccato da upsertConnectedStripeAccount, quindi la prova resta quella
    // originale indipendentemente da chi possiede l'account ora.
    const previousOwnerId = await getUserIdForStripeAccount(token.stripe_user_id);
    if (previousOwnerId && previousOwnerId !== verified.userId) {
      await clearStripeAccountForUser(previousOwnerId);
    }

    // Scrittura atomica (RPC connect_stripe_account, vedi
    // src/lib/connected-stripe-accounts.ts): registra l'account collegato e
    // aggiorna users.stripe_account_id nella stessa transazione Postgres,
    // niente stato intermedio inconsistente se una delle due scritture fallisse.
    await upsertConnectedStripeAccount({
      stripeAccountId: token.stripe_user_id,
      userId: verified.userId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      publishableKey: token.stripe_publishable_key,
      scope: token.scope,
      livemode: token.livemode ?? false,
    });

    return NextResponse.redirect(`${settingsUrl}?provider=stripe&connected=success#metodi-pagamento`);
  } catch (error) {
    console.error('Stripe Connect Callback Error:', error);
    return NextResponse.redirect(`${settingsUrl}?provider=stripe&connected=error#metodi-pagamento`);
  }
}
