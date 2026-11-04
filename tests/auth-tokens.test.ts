import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Il consumo del token (reset password / magic link) deve essere un'unica
// UPDATE condizionata: se la condizione "non usato e non scaduto" mancasse,
// lo stesso link potrebbe essere usato due volte in parallelo.
const query = vi.hoisted(() => {
  const calls: { method: string; args: unknown[] }[] = [];
  const result = { data: null as unknown, error: null as unknown };
  const builder: Record<string, unknown> = {};
  for (const method of ["from", "update", "eq", "gt", "select", "insert"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder.maybeSingle = async () => result;
  return { calls, result, builder };
});

vi.mock("@/lib/supabase-admin", () => ({ supabaseAdmin: query.builder }));

import { consumeAuthToken } from "@/lib/auth-tokens";

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

describe("consumeAuthToken", () => {
  beforeEach(() => {
    query.calls.length = 0;
    query.result.data = null;
    query.result.error = null;
  });

  it("aggiorna in un'unica query con tutte le condizioni di validità", async () => {
    query.result.data = { id: "t1", user_id: "u1", purpose: "password_reset" };
    await consumeAuthToken("raw-token", "password_reset");

    const eq = query.calls.filter((c) => c.method === "eq").map((c) => c.args);
    expect(query.calls.find((c) => c.method === "update")?.args[0]).toEqual({ used: true });
    expect(eq).toContainEqual(["used", false]);
    expect(eq).toContainEqual(["purpose", "password_reset"]);
    expect(query.calls.find((c) => c.method === "gt")?.args[0]).toBe("expires_at");
  });

  it("cerca per hash: il token in chiaro non arriva mai al database", async () => {
    await consumeAuthToken("raw-token", "magic_link");
    const hashFilter = query.calls.find((c) => c.method === "eq" && c.args[0] === "token_hash");
    expect(JSON.stringify(query.calls)).not.toContain('"raw-token"');
    expect(hashFilter?.args[1]).toBe(sha256("raw-token"));
  });

  it("restituisce l'utente quando il token era valido", async () => {
    query.result.data = { id: "t1", user_id: "u1", purpose: "magic_link" };
    expect(await consumeAuthToken("raw-token", "magic_link")).toEqual({ id: "t1", userId: "u1", purpose: "magic_link" });
  });

  it("restituisce null se il token è già usato, scaduto o inesistente", async () => {
    query.result.data = null;
    expect(await consumeAuthToken("raw-token", "magic_link")).toBeNull();
  });

  it("propaga gli errori del database invece di considerarli un successo", async () => {
    query.result.error = { message: "connessione persa" };
    await expect(consumeAuthToken("raw-token", "magic_link")).rejects.toThrow(/connessione persa/);
  });
});
