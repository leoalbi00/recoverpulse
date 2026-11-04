import { beforeEach, describe, expect, it, vi } from "vitest";

import { decryptSecret, encryptSecret } from "@/lib/encryption";

// Cifratura AES-256-GCM dei token OAuth PayPal/GoCardless salvati su Supabase.
describe("encryption", () => {
  beforeEach(() => {
    vi.stubEnv("CREDENTIALS_ENCRYPTION_KEY", "chiave-di-test");
  });

  it("decifra quello che cifra", () => {
    expect(decryptSecret(encryptSecret("access_token_123"))).toBe("access_token_123");
  });

  it("usa un IV casuale: lo stesso valore produce cifrati diversi", () => {
    expect(encryptSecret("uguale")).not.toBe(encryptSecret("uguale"));
  });

  it("non salva il valore in chiaro", () => {
    expect(encryptSecret("segreto-visibile")).not.toContain("segreto-visibile");
  });

  it("rileva un cifrato manomesso (auth tag GCM)", () => {
    const [iv, tag, ciphertext] = encryptSecret("access_token_123").split(".");
    const bytes = Buffer.from(ciphertext, "base64url");
    bytes[0] ^= 0xff;
    expect(() => decryptSecret([iv, tag, bytes.toString("base64url")].join("."))).toThrow();
  });

  it("non decifra con una chiave diversa", () => {
    const payload = encryptSecret("access_token_123");
    vi.stubEnv("CREDENTIALS_ENCRYPTION_KEY", "altra-chiave");
    expect(() => decryptSecret(payload)).toThrow();
  });

  it("rifiuta un formato non valido", () => {
    expect(() => decryptSecret("non-cifrato")).toThrow("Formato del valore cifrato non valido.");
  });

  it("si rifiuta di cifrare senza chiave configurata", () => {
    vi.stubEnv("CREDENTIALS_ENCRYPTION_KEY", "");
    expect(() => encryptSecret("x")).toThrow(/CREDENTIALS_ENCRYPTION_KEY/);
  });
});
