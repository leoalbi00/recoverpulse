import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPlatformStripeClient } from "@/lib/stripe";
import { getStripeCustomerForUser } from "@/lib/billing";
import { getAppBaseUrl } from "@/lib/app-url";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const customerId = await getStripeCustomerForUser(session.user.id);
  if (!customerId) {
    return NextResponse.json(
      { error: "Nessun abbonamento attivo. Scegli un piano qui sotto per iniziare." },
      { status: 404 }
    );
  }

  // URL di ritorno fisso (non dall'header Origin, controllabile dal client):
  // evita che il portale Stripe rimandi l'utente su un dominio arbitrario.
  const origin = getAppBaseUrl();

  try {
    const stripe = await getPlatformStripeClient();
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
