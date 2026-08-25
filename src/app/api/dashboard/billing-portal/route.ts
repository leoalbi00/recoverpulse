import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";
import { getStripeCustomerForUser } from "@/lib/billing";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const customerId = getStripeCustomerForUser(session.user.id);
  if (!customerId) {
    return NextResponse.json(
      { error: "Nessun abbonamento attivo. Scegli un piano qui sotto per iniziare." },
      { status: 404 }
    );
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  try {
    const stripe = await getStripeClient();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/impostazioni`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe billing portal error:", error);
    return NextResponse.json(
      { error: "Impossibile aprire il portale di fatturazione." },
      { status: 500 }
    );
  }
}
