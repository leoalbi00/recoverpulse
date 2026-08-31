import { NextResponse } from "next/server";

import { signIn } from "@/auth";
import { validateAuthToken } from "@/lib/auth-tokens";

/**
 * Consuma il link Magic Link inviato da POST /api/auth/magic-link. Il token
 * viene pre-validato qui (sola lettura) prima di delegare a signIn(): così
 * un token non valido/scaduto viene intercettato subito, senza dover capire
 * dall'URL di ritorno di signIn() se l'autenticazione è riuscita o no
 * (comportamento non da dare per garantito su un'API beta). authorize() del
 * provider "magic-link" (src/auth.ts) lo rivalida e lo consuma per davvero —
 * costo trascurabile, nessuna ambiguità residua.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=magic-link", request.url));
  }

  const preCheck = await validateAuthToken(token, "magic_link").catch((error) => {
    console.error("[magic-link-callback] errore nella verifica del token:", error);
    return null;
  });

  if (!preCheck) {
    return NextResponse.redirect(new URL("/login?error=magic-link", request.url));
  }

  try {
    await signIn("magic-link", { token, redirect: false });
  } catch (error) {
    console.error("[magic-link-callback] signIn fallito:", error);
    return NextResponse.redirect(new URL("/login?error=magic-link", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
