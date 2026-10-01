import { redirect } from "next/navigation";

/**
 * Alias di compatibilità: alcuni link di dunning storici/esterni puntano a
 * `/pay/update-method?token=XYZ` (forma citata nelle specifiche del portale
 * 1-click). L'implementazione reale resta `/pay/[token]`
 * (src/app/pay/[token]/page.tsx) — il token nel path, non in query string,
 * evita che finisca nei log di accesso/referrer di eventuali servizi terzi.
 * Nessun token valido = redirect alla stessa pagina di errore mostrata da
 * `/pay/[token]` per un token mancante.
 */
export default async function UpdateMethodRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  redirect(`/pay/${token ?? ""}`);
}
