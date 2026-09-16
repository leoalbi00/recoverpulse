import "server-only";
import crypto from "node:crypto";

// Generalizzazione dello state CSRF firmato già usato dal flusso Stripe
// Connect (src/lib/stripe-connect-state.ts), riutilizzato dai nuovi flussi
// OAuth 1-click (PayPal Partner, GoCardless): stesso principio (firma
// HMAC-SHA256 con AUTH_SECRET, nessuno store server-side), con l'aggiunta di
// `provider` nel payload per impedire che lo state generato per un flusso
// venga riusato su un altro.
const STATE_TTL_MS = 10 * 60 * 1000;

function sign(payload: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET non configurato: impossibile firmare lo state OAuth.");
  }
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createConnectState(provider: string, userId: string): string {
  const payload = Buffer.from(JSON.stringify({ provider, userId, exp: Date.now() + STATE_TTL_MS })).toString(
    "base64url"
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyConnectState(provider: string, state: string): { userId: string } | null {
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
      provider?: unknown;
      userId?: unknown;
      exp?: unknown;
    };
    if (decoded.provider !== provider) return null;
    if (typeof decoded.userId !== "string" || typeof decoded.exp !== "number") return null;
    if (Date.now() > decoded.exp) return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}
