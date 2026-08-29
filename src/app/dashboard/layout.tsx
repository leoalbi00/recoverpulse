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
  // L'header desktop è "sticky" con sfondo bg-zinc-950 totalmente opaco
  // (nessuna trasparenza/backdrop-blur): durante lo scroll il contenuto
  // scorre correttamente dietro la fascia opaca invece di trasparire o
  // sovrapporsi visivamente.
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <DashboardSidebar user={session.user} />
      <div className="flex flex-col md:pl-64">
        <header className="sticky top-0 z-50 hidden w-full items-center justify-end gap-1 border-b border-zinc-800 bg-zinc-950 p-4 shadow-sm md:flex">
          <NotificationBell />
        </header>
        <main className="flex-1 space-y-6 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
