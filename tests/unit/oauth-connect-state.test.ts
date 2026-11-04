import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createConnectState, verifyConnectState } from "@/lib/oauth-connect-state";

// State CSRF firmato dei flussi OAuth (Stripe/PayPal/GoCardless): è l'unica
// cosa che lega il callback all'utente che ha avviato il collegamento.
describe("oauth-connect-state", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-secret-a");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("verifica uno state valido e restituisce l'utente", () => {
    const state = createConnectState("paypal", "user-1");
    expect(verifyConnectState("paypal", state)).toEqual({ userId: "user-1" });
  });

  it("rifiuta uno state generato per un altro provider", () => {
    const state = createConnectState("paypal", "user-1");
    expect(verifyConnectState("gocardless", state)).toBeNull();
  });

  it("rifiuta un payload modificato (userId sostituito)", () => {
    const state = createConnectState("stripe", "user-1");
    const [, signature] = state.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ provider: "stripe", userId: "attacker", exp: Date.now() + 60_000 })
    ).toString("base64url");
    expect(verifyConnectState("stripe", `${forgedPayload}.${signature}`)).toBeNull();
  });

  it("rifiuta uno state firmato con un altro secret", () => {
    const state = createConnectState("stripe", "user-1");
    vi.stubEnv("AUTH_SECRET", "test-secret-b");
    expect(verifyConnectState("stripe", state)).toBeNull();
  });

  it("rifiuta uno state scaduto (oltre 10 minuti)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T10:00:00Z"));
    const state = createConnectState("stripe", "user-1");
    vi.setSystemTime(new Date("2026-11-04T10:10:01Z"));
    expect(verifyConnectState("stripe", state)).toBeNull();
  });

  it.each(["", "solo-payload", ".firma", "a.b.c", "forged.state"])("rifiuta lo state malformato %j", (state) => {
    expect(verifyConnectState("stripe", state)).toBeNull();
  });

  it("non verifica nulla se AUTH_SECRET manca", () => {
    const state = createConnectState("stripe", "user-1");
    vi.stubEnv("AUTH_SECRET", "");
    expect(verifyConnectState("stripe", state)).toBeNull();
  });
});
