import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { seedDemoTransactions } from "@/lib/transactions";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Non disponibile in produzione." }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const transactions = seedDemoTransactions();
  return NextResponse.json({ success: true, count: transactions.length });
}
