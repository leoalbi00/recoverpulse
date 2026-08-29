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
  // L'header desktop è "sticky" con sfondo opaco hardcoded via style inline
  // (oltre a bg-zinc-950 in classe) cosi' nessuno stile ereditato o classe
  // Tailwind puo' renderlo trasparente durante lo scroll.
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <DashboardSidebar user={session.user} />
      <div className="flex flex-col md:pl-64">
        <header
          className="sticky top-0 z-50 hidden w-full items-center justify-end border-b border-zinc-800 p-4 md:flex"
          style={{ backgroundColor: "#09090b" }}
        >
          <NotificationBell />
        </header>
        <main className="flex-1 p-6 md:p-8 pt-8 space-y-6 bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}
