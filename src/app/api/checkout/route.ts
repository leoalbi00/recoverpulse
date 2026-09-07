import { NextResponse } from "next/server";

// RecoverPulse è in Beta Gratuita Pubblica: il checkout per l'abbonamento
// SaaS della piattaforma è temporaneamente disattivato (accesso completo e
// gratuito a tutte le funzionalità Email, vedi src/lib/paywall.ts). Non
// tocca Stripe Connect (src/app/api/stripe/connect/*), che resta attivo per
// il recupero pagamenti del Merchant.
//
// Il checkout reale (piani a pagamento via getPlatformStripeClient) resta
// nella cronologia git: da ripristinare qui quando la Beta terminerà.
export async function POST() {
  return NextResponse.json(
    {
      error:
        "RecoverPulse è attualmente in Beta Gratuita: il checkout è temporaneamente disabilitato. Usa la piattaforma al 100% senza costi di abbonamento.",
    },
    { status: 403 }
  );
}
