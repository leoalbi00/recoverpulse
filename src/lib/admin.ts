// Nessun ruolo "admin" persistito su Supabase: l'unico account
// Sviluppatore/Superadmin è riconosciuto per email. Usato sia lato server
// (guardia di accesso a /dashboard/developer, instradamento della notifica di
// una nuova richiesta pilota) sia lato client (mostra lo switch "Vista
// Sviluppatore" nella sidebar), quindi questo file NON è "server-only".
export const ADMIN_EMAIL = "leo.elox.24@gmail.com";

export function isAdminEmail(email?: string | null): boolean {
  return (email ?? "").trim().toLowerCase() === ADMIN_EMAIL;
}
