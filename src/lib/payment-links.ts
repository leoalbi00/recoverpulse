declare global {
  var __recoverpulsePaymentLinks: Map<string, string> | undefined;
}

// In-memory demo store (token -> invoiceId) — sopravvive ai reload del dev server
// grazie a `globalThis`, ma va sostituito con un database vero prima della produzione.
const paymentLinks = globalThis.__recoverpulsePaymentLinks ?? new Map<string, string>();
if (process.env.NODE_ENV !== "production") {
  globalThis.__recoverpulsePaymentLinks = paymentLinks;
}

/**
 * Restituisce il token esistente per una fattura, oppure ne genera uno nuovo.
 * Lo stesso link viene quindi riutilizzato per tutti i solleciti (WhatsApp/SMS/Email)
 * di una stessa fattura fallita.
 */
export function getOrCreatePaymentLinkToken(invoiceId: string): string {
  for (const [token, id] of paymentLinks) {
    if (id === invoiceId) return token;
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  paymentLinks.set(token, invoiceId);
  return token;
}

export function resolveInvoiceIdFromToken(token: string): string | null {
  return paymentLinks.get(token) ?? null;
}
