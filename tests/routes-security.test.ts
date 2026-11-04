import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Test di autorizzazione delle rotte che proteggono le operazioni più
// sensibili. Tutte le dipendenze con effetti esterni (Supabase, Stripe,
// PayPal, email) sono sostituite da mock: qui conta solo quale decisione
// prende la rotta e cosa NON deve mai essere chiamato.

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getIntegrationSettings: vi.fn(),
  updateIntegrationSettings: vi.fn(),
  validatePaymentToken: vi.fn(),
  markPaymentTokenUsed: vi.fn(),
  getTransactionByCustomerId: vi.fn(),
  markInvoiceRecovered: vi.fn(),
  tryCreateSetupIntent: vi.fn(),
  claimWebhookEvent: vi.fn(),
  getUserIdForOrganisation: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/integration-settings", () => ({
  getIntegrationSettings: mocks.getIntegrationSettings,
  updateIntegrationSettings: mocks.updateIntegrationSettings,
  maskSecret: (value: string) => (value ? "••••" : ""),
}));
vi.mock("@/lib/tokens", () => ({
  validatePaymentToken: mocks.validatePaymentToken,
  markPaymentTokenUsed: mocks.markPaymentTokenUsed,
  createPaymentToken: vi.fn(),
}));
vi.mock("@/lib/transactions", () => ({
  getTransactionByCustomerId: mocks.getTransactionByCustomerId,
  markInvoiceRecovered: mocks.markInvoiceRecovered,
  recordFailedPayment: vi.fn(),
}));
vi.mock("@/lib/payment-portal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payment-portal")>();
  return { ...actual, tryCreateSetupIntent: mocks.tryCreateSetupIntent };
});
vi.mock("@/lib/stripe", () => ({ getStripeClientForAccount: vi.fn(), getPlatformStripeClient: vi.fn() }));
vi.mock("@/lib/connected-stripe-accounts", () => ({ getStripeAccountIdForUser: vi.fn() }));
vi.mock("@/lib/dunning", () => ({ stopDunningSequence: vi.fn(), startDunningSequence: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ notifyPaymentRecovered: vi.fn(), notifyPaymentFailed: vi.fn() }));
vi.mock("@/lib/paypal-settings", () => ({ getPaypalSettings: vi.fn(), isPaypalConfigured: vi.fn() }));
vi.mock("@/lib/paypal-partner", () => ({ getValidPaypalAccessToken: vi.fn() }));
vi.mock("@/lib/paypal", () => ({ getPaypalSubscription: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendRecoveryConfirmationEmail: vi.fn(), sendTestEmail: vi.fn() }));
vi.mock("@/lib/webhook-idempotency", () => ({
  claimWebhookEvent: mocks.claimWebhookEvent,
  releaseWebhookEvent: vi.fn(),
}));
vi.mock("@/lib/connected-gocardless-accounts", () => ({
  getConnectedGoCardlessAccountForUser: vi.fn(),
  getUserIdForOrganisation: mocks.getUserIdForOrganisation,
}));
vi.mock("@/lib/gocardless", () => ({ getCustomer: vi.fn(), getMandate: vi.fn(), getPayment: vi.fn() }));

import * as integrationSettings from "@/app/api/dashboard/integration-settings/route";
import * as confirmRoute from "@/app/api/update-payment/[token]/confirm/route";
import * as gocardlessWebhook from "@/app/api/v1/webhooks/gocardless/route";
import { ADMIN_EMAIL } from "@/lib/admin";

const session = (email: string) => ({ user: { id: "user-1", email } });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getIntegrationSettings.mockResolvedValue({ resendApiKey: "re_live_key", stripeSecretKey: "" });
  mocks.updateIntegrationSettings.mockResolvedValue(undefined);
});

describe("integration-settings: credenziali globali solo per l'admin", () => {
  const patch = () =>
    integrationSettings.PATCH(
      new Request("http://localhost/api/dashboard/integration-settings", {
        method: "PATCH",
        body: JSON.stringify({ resendApiKey: "re_attacker" }),
      })
    );

  it("401 senza sessione", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await integrationSettings.GET()).status).toBe(401);
    expect((await patch()).status).toBe(401);
  });

  it("403 a un utente normale: non legge e non sostituisce la Resend API Key", async () => {
    mocks.auth.mockResolvedValue(session("merchant@example.com"));
    expect((await integrationSettings.GET()).status).toBe(403);
    expect((await patch()).status).toBe(403);
    expect(mocks.getIntegrationSettings).not.toHaveBeenCalled();
    expect(mocks.updateIntegrationSettings).not.toHaveBeenCalled();
  });

  it("l'admin può leggere, e riceve solo valori mascherati", async () => {
    mocks.auth.mockResolvedValue(session(ADMIN_EMAIL));
    const response = await integrationSettings.GET();
    expect(response.status).toBe(200);
    const body = JSON.stringify(await response.json());
    expect(body).not.toContain("re_live_key");
  });
});

describe("portale di pagamento: conferma simulata", () => {
  const confirm = (body: unknown, token = "tok_valid") =>
    confirmRoute.POST(
      new Request(`http://localhost/api/update-payment/${token}/confirm`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ token }) } as never
    );

  const transaction = (invoiceId: string) => ({
    invoiceId,
    userId: "merchant-1",
    customerId: "cus_1",
    customerEmail: "cliente@example.com",
    customerName: "Cliente",
    planName: "Pro",
    amount: 19900,
    currency: "eur",
    status: "in_corso",
    paymentMethodType: "card",
  });

  beforeEach(() => {
    mocks.validatePaymentToken.mockResolvedValue({ customerId: "cus_1", userId: "merchant-1" });
    mocks.tryCreateSetupIntent.mockResolvedValue(null);
  });

  it("404 con un token inesistente", async () => {
    mocks.validatePaymentToken.mockResolvedValue(null);
    expect((await confirm({ simulate: true }, "inventato")).status).toBe(404);
    expect(mocks.markInvoiceRecovered).not.toHaveBeenCalled();
  });

  it("403 su un insoluto reale: il cliente non può chiuderlo senza pagare", async () => {
    mocks.getTransactionByCustomerId.mockResolvedValue(transaction("in_1RealInvoice"));
    const response = await confirm({ simulate: true });
    expect(response.status).toBe(403);
    expect(mocks.markInvoiceRecovered).not.toHaveBeenCalled();
    expect(mocks.markPaymentTokenUsed).not.toHaveBeenCalled();
  });

  it("409 sulla transazione di test se Stripe è disponibile (va usato il modulo reale)", async () => {
    mocks.getTransactionByCustomerId.mockResolvedValue(transaction("test_abc"));
    mocks.tryCreateSetupIntent.mockResolvedValue("seti_secret");
    expect((await confirm({ simulate: true })).status).toBe(409);
    expect(mocks.markInvoiceRecovered).not.toHaveBeenCalled();
  });

  it("consente la simulazione solo sulla transazione di test", async () => {
    mocks.getTransactionByCustomerId.mockResolvedValue(transaction("test_abc"));
    mocks.markInvoiceRecovered.mockResolvedValue(null);
    const response = await confirm({ simulate: true });
    expect(response.status).toBe(200);
    expect(mocks.markInvoiceRecovered).toHaveBeenCalledWith("test_abc", "merchant-1");
  });

  it("400 con un corpo non valido", async () => {
    mocks.getTransactionByCustomerId.mockResolvedValue(transaction("in_1RealInvoice"));
    expect((await confirm({ simulate: "true" })).status).toBe(400);
  });
});

describe("webhook GoCardless: firma HMAC", () => {
  const SECRET = "gc_webhook_secret_test";
  const body = JSON.stringify({ events: [] });
  const sign = (payload: string, secret = SECRET) => crypto.createHmac("sha256", secret).update(payload).digest("hex");
  let ipCounter = 0;

  const send = (signature: string | null, payload = body) =>
    gocardlessWebhook.POST(
      new Request("http://localhost/api/v1/webhooks/gocardless", {
        method: "POST",
        body: payload,
        headers: {
          "x-real-ip": `10.0.0.${ipCounter++}`,
          ...(signature === null ? {} : { "webhook-signature": signature }),
        },
      })
    );

  beforeEach(() => {
    vi.stubEnv("GOCARDLESS_WEBHOOK_SECRET", SECRET);
  });

  it("accetta una firma valida", async () => {
    expect((await send(sign(body))).status).toBe(200);
  });

  it("401 senza firma", async () => {
    expect((await send(null)).status).toBe(401);
  });

  it("401 con firma calcolata con un altro secret", async () => {
    expect((await send(sign(body, "altro"))).status).toBe(401);
  });

  it("401 se il corpo viene modificato dopo la firma", async () => {
    const tampered = JSON.stringify({ events: [{ id: "EV1", resource_type: "payments", action: "failed" }] });
    expect((await send(sign(body), tampered)).status).toBe(401);
    expect(mocks.getUserIdForOrganisation).not.toHaveBeenCalled();
  });

  it("in produzione rifiuta tutto se il secret non è configurato", async () => {
    vi.stubEnv("GOCARDLESS_WEBHOOK_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    expect((await send(sign(body))).status).toBe(401);
  });
});
