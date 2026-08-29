import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

// Config edge-safe (nessuna dipendenza Node-only come bcrypt): usata sia dal
// middleware (Edge Runtime) sia da auth.ts, che aggiunge i provider Node-only.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      // Difesa in profondità: le route /api/dashboard/* e /api/test/* fanno già
      // ciascuna il proprio controllo `auth()` (vedi i singoli route handler),
      // ma il middleware le blocca comunque a monte così una futura route
      // aggiunta sotto questi prefissi senza il controllo non resta scoperta.
      // Risposta JSON 401 (non redirect alla pagina di login) per restare
      // coerente col contratto delle altre risposte di queste API.
      const isProtectedApi =
        nextUrl.pathname.startsWith("/api/dashboard") || nextUrl.pathname.startsWith("/api/test");

      if (isProtectedApi) {
        if (isLoggedIn) return true;
        return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
      }

      if (isOnDashboard) return isLoggedIn;
      return true;
    },
  },
} satisfies NextAuthConfig;
