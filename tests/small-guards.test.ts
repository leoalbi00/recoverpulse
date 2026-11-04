import { describe, expect, it, vi } from "vitest";

// payment-portal importa i client Stripe/Supabase: qui serve solo la guardia
// pura, quindi i moduli con effetti collaterali vengono sostituiti.
vi.mock("@/lib/stripe", () => ({ getStripeClientForAccount: vi.fn() }));
vi.mock("@/lib/connected-stripe-accounts", () => ({ getStripeAccountIdForUser: vi.fn() }));

import { ADMIN_EMAIL, isAdminEmail } from "@/lib/admin";
import { getAppBaseUrl } from "@/lib/app-url";
import { isSimulatableTransaction } from "@/lib/payment-portal";

describe("isAdminEmail", () => {
  it("riconosce l'admin ignorando maiuscole e spazi", () => {
    expect(isAdminEmail(`  ${ADMIN_EMAIL.toUpperCase()} `)).toBe(true);
  });

  it.each([null, undefined, "", "altro@example.com", `${ADMIN_EMAIL}.evil.com`, `x${ADMIN_EMAIL}`])(
    "rifiuta %j",
    (email) => {
      expect(isAdminEmail(email)).toBe(false);
    }
  );
});

describe("isSimulatableTransaction", () => {
  it("consente la conferma simulata solo alle transazioni di test", () => {
    expect(isSimulatableTransaction({ invoiceId: "test_3f2a" })).toBe(true);
  });

  it.each(["in_1PXYZ", "I-SUBSCRIPTION", "PM000123", "xtest_1", "TEST_1"])(
    "la blocca per l'insoluto reale %j",
    (invoiceId) => {
      expect(isSimulatableTransaction({ invoiceId })).toBe(false);
    }
  );
});

describe("getAppBaseUrl", () => {
  it("usa NEXT_PUBLIC_APP_URL senza slash finale", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", " http://localhost:3000/ ");
    expect(getAppBaseUrl()).toBe("http://localhost:3000");
  });

  it("ricade sul dominio di produzione se la variabile manca", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(getAppBaseUrl()).toBe("https://omnirev-three.vercel.app");
  });
});
