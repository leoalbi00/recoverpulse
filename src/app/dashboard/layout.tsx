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

  // "theme-light" (src/app/globals.css) sovrascrive le CSS var del tema per
  // questo sottoalbero: il resto dell'app (landing, login, register, /pay)
  // resta sul tema scuro di :root, la dashboard è sempre chiara, senza
  // switcher e senza dipendere da alcuna preferenza dell'utente.
  return (
    <div className="theme-light min-h-screen bg-slate-50">
      <DashboardSidebar user={session.user} />
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 hidden h-14 items-center justify-end gap-1 border-b border-slate-200/60 bg-slate-50/80 px-6 backdrop-blur-sm md:flex">
          <NotificationBell />
        </header>
        {children}
      </div>
    </div>
  );
}
