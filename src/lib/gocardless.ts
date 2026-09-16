import "server-only";

// Client REST + OAuth2 per l'app Partner GoCardless: collegamento 1-click
// SEPA Direct Debit (src/components/dashboard/gocardless-connect-card.tsx),
// alternativo al webhook universale generico (src/lib/merchant-api-keys.ts,
// src/app/api/v1/webhooks/sdd/route.ts) per i merchant che processano gli
// addebiti direttamente su GoCardless.
const GOCARDLESS_API_VERSION = "2015-07-06";

export type GoCardlessEnvironment = "live" | "sandbox";

const GOCARDLESS_OAUTH_BASES: Record<GoCardlessEnvironment, string> = {
  live: "https://connect.gocardless.com",
  sandbox: "https://connect-sandbox.gocardless.com",
};

const GOCARDLESS_API_BASES: Record<GoCardlessEnvironment, string> = {
  live: "https://api.gocardless.com",
  sandbox: "https://api-sandbox.gocardless.com",
};

/**
 * Legge GOCARDLESS_ENV (default "live"): quale ambiente usare per le NUOVE
 * connessioni Partner. L'ambiente di una connessione già esistente resta
 * invece quello salvato al momento del collegamento
 * (connected_gocardless_accounts.environment), così cambiare questa
 * variabile non rompe i merchant già collegati in un ambiente diverso.
 */
export function resolveGoCardlessEnvironment(): GoCardlessEnvironment {
  const raw = process.env.GOCARDLESS_ENV?.trim().toLowerCase();
  if (!raw || raw === "live") return "live";
  if (raw === "sandbox") return "sandbox";
  throw new Error(`GOCARDLESS_ENV non valido: "${raw}" (atteso "live" o "sandbox").`);
}

function getPartnerCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOCARDLESS_CLIENT_ID;
  const clientSecret = process.env.GOCARDLESS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOCARDLESS_CLIENT_ID/GOCARDLESS_CLIENT_SECRET non configurati: integrazione GoCardless non disponibile.");
  }
  return { clientId, clientSecret };
}

/** URL di autorizzazione OAuth2 per il pulsante "Connetti SEPA / GoCardless (1-Click)". */
export function buildAuthorizeUrl(state: string, redirectUri: string, environment: GoCardlessEnvironment): string {
  const { clientId } = getPartnerCredentials();
  const url = new URL(`${GOCARDLESS_OAUTH_BASES[environment]}/oauth/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("initial_view", "login");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "read_write");
  url.searchParams.set("state", state);
  return url.toString();
}

export type GoCardlessTokens = { accessToken: string; organisationId: string | null; scope: string | null };

/** Scambia l'authorization code con un access_token scoped sull'organisation GoCardless del merchant. */
export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string,
  environment: GoCardlessEnvironment
): Promise<GoCardlessTokens> {
  const { clientId, clientSecret } = getPartnerCredentials();

  const response = await fetch(`${GOCARDLESS_OAUTH_BASES[environment]}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Scambio authorization code GoCardless non riuscito (HTTP ${response.status}): ${detail}`);
  }

  const data = (await response.json()) as { access_token?: string; organisation_id?: string; scope?: string };
  if (!data.access_token) throw new Error("Risposta GoCardless senza access_token.");

  return {
    accessToken: data.access_token,
    organisationId: data.organisation_id ?? null,
    scope: data.scope ?? null,
  };
}

export type GoCardlessOrganisation = { id: string; name: string | null };

/** Recupera i dettagli dell'organisation collegata (nome mostrato in dashboard). */
export async function getOrganisation(
  accessToken: string,
  organisationId: string,
  environment: GoCardlessEnvironment
): Promise<GoCardlessOrganisation> {
  const response = await fetch(`${GOCARDLESS_API_BASES[environment]}/organisations/${organisationId}`, {
    headers: { Authorization: `Bearer ${accessToken}`, "GoCardless-Version": GOCARDLESS_API_VERSION },
  });
  if (!response.ok) return { id: organisationId, name: null };

  const data = (await response.json()) as { organisations?: { id: string; name?: string } };
  return { id: data.organisations?.id ?? organisationId, name: data.organisations?.name ?? null };
}

export type GoCardlessPayment = {
  id: string;
  amount: number;
  currency: string;
  links?: { mandate?: string };
};

/** Usata dal webhook universale (src/app/api/v1/webhooks/gocardless/route.ts) per recuperare i dettagli di un pagamento fallito. */
export async function getPayment(
  accessToken: string,
  paymentId: string,
  environment: GoCardlessEnvironment
): Promise<GoCardlessPayment> {
  const response = await fetch(`${GOCARDLESS_API_BASES[environment]}/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}`, "GoCardless-Version": GOCARDLESS_API_VERSION },
  });
  if (!response.ok) {
    throw new Error(`Recupero payment GoCardless ${paymentId} non riuscito (HTTP ${response.status}).`);
  }
  const data = (await response.json()) as { payments: GoCardlessPayment };
  return data.payments;
}

export type GoCardlessMandate = { id: string; reference: string | null; links?: { customer?: string } };

export async function getMandate(
  accessToken: string,
  mandateId: string,
  environment: GoCardlessEnvironment
): Promise<GoCardlessMandate> {
  const response = await fetch(`${GOCARDLESS_API_BASES[environment]}/mandates/${mandateId}`, {
    headers: { Authorization: `Bearer ${accessToken}`, "GoCardless-Version": GOCARDLESS_API_VERSION },
  });
  if (!response.ok) {
    throw new Error(`Recupero mandate GoCardless ${mandateId} non riuscito (HTTP ${response.status}).`);
  }
  const data = (await response.json()) as { mandates: GoCardlessMandate };
  return data.mandates;
}

export type GoCardlessCustomer = {
  id: string;
  email: string | null;
  given_name: string | null;
  family_name: string | null;
};

export async function getCustomer(
  accessToken: string,
  customerId: string,
  environment: GoCardlessEnvironment
): Promise<GoCardlessCustomer> {
  const response = await fetch(`${GOCARDLESS_API_BASES[environment]}/customers/${customerId}`, {
    headers: { Authorization: `Bearer ${accessToken}`, "GoCardless-Version": GOCARDLESS_API_VERSION },
  });
  if (!response.ok) {
    throw new Error(`Recupero customer GoCardless ${customerId} non riuscito (HTTP ${response.status}).`);
  }
  const data = (await response.json()) as { customers: GoCardlessCustomer };
  return data.customers;
}
