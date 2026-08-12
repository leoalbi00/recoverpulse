declare global {
  var __recoverpulseStripeCustomers: Map<string, string> | undefined;
}

// Mappa userId -> Stripe Customer ID, popolata dal webhook checkout.session.completed.
// In-memory demo store: sopravvive ai reload del dev server grazie a `globalThis`,
// ma va sostituito con una colonna sulla tabella utenti prima della produzione.
const customerByUser = globalThis.__recoverpulseStripeCustomers ?? new Map<string, string>();
if (process.env.NODE_ENV !== "production") {
  globalThis.__recoverpulseStripeCustomers = customerByUser;
}

export function setStripeCustomerForUser(userId: string, customerId: string) {
  customerByUser.set(userId, customerId);
}

export function getStripeCustomerForUser(userId: string): string | null {
  return customerByUser.get(userId) ?? null;
}
