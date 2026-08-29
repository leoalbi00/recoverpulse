import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardSidebar user={session.user} />
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 hidden h-14 items-center justify-end gap-1 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 px-6 backdrop-blur-sm md:flex">
          <ThemeToggle />
          <NotificationBell />
        </header>
        {children}
      </div>
    </div>
  );
}
