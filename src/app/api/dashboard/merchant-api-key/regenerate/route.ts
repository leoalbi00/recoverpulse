import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { regenerateMerchantApiKey } from "@/lib/merchant-api-keys";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  try {
    const apiKey = await regenerateMerchantApiKey(session.user.id);
    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error("[merchant-api-key] errore nella rigenerazione della API Key:", error);
    return NextResponse.json({ error: "Errore durante la rigenerazione della API Key." }, { status: 500 });
  }
}
