import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { recordFailedPayment } from "@/lib/transactions";
import { createPaymentToken } from "@/lib/tokens";
import { getAppBaseUrl } from "@/lib/app-url";

// Endpoint temporaneo per generare rapidamente un pagamento fallito di prova
// (cliente "TechCorp", €199, status "in_corso") e il relativo link del
// portale 1-click, senza dover passare da un evento Stripe reale. Disabilitato
// in produzione: da rimuovere una volta completati i test manuali.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Endpoint di test non disponibile in produzione." }, { status: 404 });
  }

  const invoiceId = `test_${crypto.randomUUID()}`;
  const customerId = `cus_test_${crypto.randomUUID().slice(0, 12)}`;

  try {
    const paymentLinkToken = await createPaymentToken({ customerId });

    const transaction = await recordFailedPayment({
      invoiceId,
      customerId,
      customerName: "TechCorp",
      customerEmail: "billing@techcorp-test.example",
      subscriptionId: null,
      planName: "Piano Test",
      amount: 19900,
      currency: "eur",
      reason: "Pagamento di test generato da /api/test/generate-failed-payment.",
      paymentLinkToken,
    });

    const portalUrl = `${getAppBaseUrl()}/pay/${paymentLinkToken}`;

    return NextResponse.json({ success: true, transaction, portalUrl });
  } catch (error) {
    console.error("[test/generate-failed-payment] errore nella generazione dei dati di test:", error);
    return NextResponse.json({ error: "Errore durante la generazione dei dati di test." }, { status: 500 });
  }
}
