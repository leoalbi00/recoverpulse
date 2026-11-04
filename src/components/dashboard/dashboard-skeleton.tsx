/**
 * Skeleton condiviso da tutti i loading.tsx sotto src/app/dashboard/*: le
 * pagine sono Server Component che leggono da Supabase, senza questo
 * boundary Next.js mostrerebbe uno schermo vuoto durante il fetch invece di
 * un feedback immediato al cambio pagina (vedi src/app/dashboard/layout.tsx,
 * che avvolge {children} — questo file sostituisce quel children finché la
 * pagina non è pronta).
 */
export function DashboardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="h-7 w-56 rounded-md bg-border/80" />
      <div className="mt-2 h-4 w-80 rounded-md bg-border/50" />

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl border border-border bg-card" />
        ))}
      </div>

      <div className="mt-10 h-72 rounded-xl border border-border bg-card" />
    </div>
  );
}
