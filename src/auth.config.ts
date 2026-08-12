import type { NextAuthConfig } from "next-auth";

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
      if (isOnDashboard) return isLoggedIn;
      return true;
    },
  },
} satisfies NextAuthConfig;
