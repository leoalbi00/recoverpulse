import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getTransaction } from "@/lib/transactions";
import { startDunningSequence } from "@/lib/dunning";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  context: RouteContext<"/api/dashboard/transactions/[invoiceId]/resend">
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { invoiceId } = await context.params;

  // Ogni reinvio è un'email reale al cliente finale: limite per fattura
  // contro click ripetuti o uso del pulsante come strumento di spam.
  if (!checkRateLimit(`resend:${session.user.id}:${invoiceId}`, 3, 60 * 60).allowed) {
    return NextResponse.json({ error: "Troppi reinvii per questa fattura. Riprova più tardi." }, { status: 429 });
  }
  const transaction = await getTransaction(decodeURIComponent(invoiceId), session.user.id);

  if (!transaction) {
    return NextResponse.json({ error: "Transazione non trovata." }, { status: 404 });
  }

  if (transaction.status === "recuperato") {
    return NextResponse.json(
      { error: "Il pagamento è già stato recuperato, nessun sollecito da inviare." },
      { status: 409 }
    );
  }

  // Azione manuale ed esplicita dell'operatore: va inviata anche se
  // l'automazione dunning è in pausa da /dashboard/dunning.
  await startDunningSequence(transaction, { skipAutomationGate: true });

  return NextResponse.json({ success: true });
}
