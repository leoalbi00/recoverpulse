import "server-only";
import crypto from "node:crypto";

// State CSRF per il flusso OAuth Stripe Connect (src/app/api/stripe/connect/*):
// firmato con AUTH_SECRET invece di uno store server-side, per evitare il
// rischio delle Map in-memory (src/lib/rate-limit.ts, src/lib/billing.ts) su
// cold start/istanze multiple serverless durante un redirect multi-step come
// questo. Stesso principio del confronto a tempo costante già usato in
// src/app/api/register/route.ts per il codice invito.
const STATE_TTL_MS = 10 * 60 * 1000;

function sign(payload: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET non configurato: impossibile firmare lo state OAuth Stripe Connect.");
  }
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createConnectState(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + STATE_TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyConnectState(state: string): { userId: string } | null {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;

  let expectedSignature: string;
  try {
    expectedSignature = sign(payload);
  } catch {
    return null;
  }

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId?: unknown;
      exp?: unknown;
    };
    if (typeof decoded.userId !== "string" || typeof decoded.exp !== "number") return null;
    if (Date.now() > decoded.exp) return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}
