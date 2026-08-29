import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Middleware separato dedicato: usa solo la config edge-safe (senza il
// provider Credentials, che dipende da bcryptjs/Node) per proteggere /dashboard.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*", "/api/test/:path*"],
};
