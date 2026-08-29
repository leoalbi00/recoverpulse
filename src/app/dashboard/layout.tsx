import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { NotificationBell } from "@/components/dashboard/notification-bell";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Cornice bicolore: pagina, header e sidebar restano scuri (bg-zinc-950,
  // testo text-zinc-100), mentre ogni card/tabella/modulo al loro interno è
  // un riquadro bianco con testo scuro (vedi i singoli componenti sotto
  // src/components/dashboard/ e le pagine sotto src/app/dashboard/).
  // L'header non è più "sticky": con lo sticky, appena si scorreva anche di
  // poco la pagina si "incollava" in cima e finiva a coprire il titolo (che
  // nel normale flusso di scroll passa proprio dietro alla sua fascia
  // d'altezza) — con l'header nel normale flusso verticale, invece, scorre
  // via insieme al resto della pagina e non può mai sovrapporsi al
  // contenuto sottostante.
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <DashboardSidebar user={session.user} />
      <div className="flex flex-col md:pl-64">
        <header className="z-40 hidden h-14 items-center justify-end gap-1 border-b border-zinc-800 bg-zinc-950 px-6 md:flex">
          <NotificationBell />
        </header>
        {children}
      </div>
    </div>
  );
}
