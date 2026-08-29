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

  // Cornice "Hybrid High-Contrast": pagina, header e sidebar restano scuri
  // (bg-zinc-950/bg-zinc-900, classi fisse che ignorano le CSS var del
  // tema), mentre ogni card/tabella/modulo al loro interno è un riquadro
  // bianco. "theme-light" (src/app/globals.css) resta comunque applicata a
  // tutto il sottoalbero: serve solo ai componenti shadcn (Button, Badge,
  // Switch) usati dentro le card, che leggono le CSS var del tema — la
  // cornice non le usa affatto, quindi ignora "theme-light" e resta scura.
  return (
    <div className="theme-light min-h-screen bg-zinc-950">
      <DashboardSidebar user={session.user} />
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 hidden h-14 items-center justify-end gap-1 border-b border-zinc-800 bg-zinc-900/80 px-6 backdrop-blur-sm md:flex">
          <NotificationBell />
        </header>
        {children}
      </div>
    </div>
  );
}
