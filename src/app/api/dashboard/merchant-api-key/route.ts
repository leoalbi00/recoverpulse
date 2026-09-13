import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getOrCreateMerchantApiKey } from "@/lib/merchant-api-keys";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  try {
    const apiKey = await getOrCreateMerchantApiKey(session.user.id);
    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error("[merchant-api-key] errore nel recupero della API Key:", error);
    return NextResponse.json({ error: "Errore durante il recupero della API Key." }, { status: 500 });
  }
}
