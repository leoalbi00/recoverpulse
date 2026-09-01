import { redirect } from "next/navigation";

/**
 * La gestione canali (Email/SMS/WhatsApp) è confluita nei tab di
 * /dashboard/dunning (src/components/dashboard/dunning-channel-tabs.tsx):
 * questo redirect mantiene validi eventuali link/segnalibri verso la vecchia
 * rotta invece di restituire un 404.
 */
export default function SequenzePage() {
  redirect("/dashboard/dunning");
}
