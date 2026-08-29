import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import { findUserByEmail, verifyPassword } from "@/lib/users";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Hash fittizio (nessuna password reale lo produce) usato per far eseguire a
// bcrypt.compare() lo stesso lavoro anche quando l'utente non esiste: senza
// questo, il ramo "utente non trovato" ritornerebbe quasi istantaneamente
// mentre quello "password errata" impiega il tempo di un compare bcrypt,
// rivelando via timing quali email sono registrate.
const DUMMY_PASSWORD_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8Q8w8n1XzWvi0mHNs.dj/lyBc4G3Vy";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credenziali",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const ip = getClientIp(request);
        const { allowed } = checkRateLimit(`login:${ip}:${parsed.data.email.toLowerCase()}`, 10, 15 * 60);
        if (!allowed) return null;

        const user = await findUserByEmail(parsed.data.email);
        if (!user) {
          // Vedi commento su DUMMY_PASSWORD_HASH: manteniamo il timing
          // costante rispetto al caso "password errata".
          await bcrypt.compare(parsed.data.password, DUMMY_PASSWORD_HASH);
          return null;
        }

        const isValid = await verifyPassword(user, parsed.data.password);
        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
