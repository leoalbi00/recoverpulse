import "server-only";

const PRODUCTION_URL = "https://omnirev-three.vercel.app";

// URL assoluto usato nei link delle email e come redirect_uri OAuth
// (Stripe/PayPal/GoCardless). Prima era fisso sul dominio di produzione
// anche in locale: un collegamento OAuth avviato da localhost tornava sul
// callback di produzione, dove lo state firmato con l'AUTH_SECRET locale non
// era valido → "connected=error". Ora segue NEXT_PUBLIC_APP_URL (impostalo
// all'URL di produzione su Vercel), con il dominio di produzione come
// fallback se la variabile manca.
export function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  return configured || PRODUCTION_URL;
}
