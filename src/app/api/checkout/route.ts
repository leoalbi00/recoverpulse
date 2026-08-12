import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";

// Se in produzione preferisci Price ID pre-creati su Stripe (per reportistica,
// trial personalizzati, ecc.), valorizza queste variabili: hanno priorità sul
// fallback price_data inline usato per far funzionare il checkout da subito.
const PLAN_PRICE_ENV: Record<PlanId, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
  scale: process.env.STRIPE_PRICE_SCALE,
};

const checkoutSchema = z.object({
  plan: z.enum(["starter", "growth", "scale"]),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Piano non valido." }, { status: 400 });
  }

  const plan = PLANS.find((p) => p.id === parsed.data.plan);
  if (!plan) {
    return NextResponse.json({ error: "Piano non valido." }, { status: 400 });
  }

  const priceId = PLAN_PRICE_ENV[parsed.data.plan];

  const session = await auth();
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const referer = request.headers.get("referer");

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        priceId
          ? { price: priceId, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: plan.priceInCents,
                recurring: { interval: "month" },
                product_data: {
                  name: `RecoverPulse — Piano ${plan.name}`,
                  description: plan.description,
                },
              },
            },
      ],
      customer_email: session?.user?.email ?? undefined,
      client_reference_id: session?.user?.id,
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: referer ?? `${origin}/#pricing`,
      allow_promotion_codes: true,
    });

    if (!checkoutSession.url) {
      throw new Error("Stripe non ha restituito un URL di checkout.");
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      {
        error:
          "Impossibile avviare il checkout. Verifica STRIPE_SECRET_KEY e che il Price ID esista sul tuo account Stripe.",
      },
      { status: 500 }
    );
  }
}
