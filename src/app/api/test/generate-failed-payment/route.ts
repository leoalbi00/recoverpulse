import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { auth } from "@/auth";
import { recordFailedPayment } from "@/lib/transactions";
import { createPaymentToken } from "@/lib/tokens";
import { getAppBaseUrl } from "@/lib/app-url";
import { createNotification } from "@/lib/notifications";

// Endpoint temporaneo per generare rapidamente un pagamento fallito di prova
// (cliente "TechCorp", €199, status "in_corso") e il relativo link del
// portale 1-click, senza dover passare da un evento Stripe reale. Abilitato
// anche in produzione per il test E2E guidato del flusso di recupero, ma
// protetto da sessione autenticata (stessa postura delle altre route
// /api/dashboard/*): da rimuovere una volta completati i test manuali.
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
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

    const amountLabel = new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: transaction.currency.toUpperCase(),
    }).format(transaction.amount / 100);

    // La notifica in-app è un effetto collaterale: se fallisce non deve far
    // fallire la generazione della transazione di test, già salvata sopra.
    try {
      await createNotification({
        type: "warning",
        title: "Nuovo pagamento fallito",
        message: `Nuovo pagamento fallito intercettato: ${transaction.customerName} - ${amountLabel}`,
      });
    } catch (notificationError) {
      console.error(
        "[test/generate-failed-payment] errore nella creazione della notifica di avviso:",
        notificationError
      );
    }

    return NextResponse.json({ success: true, transaction, portalUrl });
  } catch (error) {
    console.error("[test/generate-failed-payment] errore nella generazione dei dati di test:", error);
    return NextResponse.json({ error: "Errore durante la generazione dei dati di test." }, { status: 500 });
  }
}
