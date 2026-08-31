import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { clearStripeAccountForUser, getConnectedAccountForUser } from "@/lib/connected-stripe-accounts";
import { getTrialStatus } from "@/lib/trial";

/** Stato della connessione Stripe + prova, letto da src/components/dashboard/stripe-connect-card.tsx e trial-banner.tsx. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const [account, trial] = await Promise.all([
    getConnectedAccountForUser(session.user.id).catch((error) => {
      console.error("[stripe-connect] errore nel recupero dell'account collegato:", error);
      return null;
    }),
    getTrialStatus(session.user.id),
  ]);

  return NextResponse.json({
    connected: account !== null,
    stripeAccountId: account?.stripeAccountId ?? null,
    livemode: account?.livemode ?? null,
    trial,
  });
}

/** Disconnette Stripe: azzera solo il collegamento dell'utente, non il registro permanente della prova. */
export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  await clearStripeAccountForUser(session.user.id);
  return NextResponse.json({ success: true });
}
