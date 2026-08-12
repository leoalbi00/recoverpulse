import Stripe from "stripe";

// La chiave viene letta a runtime (mai al load del modulo): se manca, le singole
// chiamate Stripe falliranno con un errore chiaro invece di far crashare l'intera
// build/app — altre route che non usano Stripe restano quindi funzionanti.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
