import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getTransaction } from "@/lib/transactions";
import { startDunningSequence } from "@/lib/dunning";

export async function POST(
  request: Request,
  context: RouteContext<"/api/dashboard/transactions/[invoiceId]/resend">
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { invoiceId } = await context.params;
  const transaction = getTransaction(decodeURIComponent(invoiceId));

  if (!transaction) {
    return NextResponse.json({ error: "Transazione non trovata." }, { status: 404 });
  }

  if (transaction.status === "recuperato") {
    return NextResponse.json(
      { error: "Il pagamento è già stato recuperato, nessun sollecito da inviare." },
      { status: 409 }
    );
  }

  await startDunningSequence(transaction);

  return NextResponse.json({ success: true });
}
