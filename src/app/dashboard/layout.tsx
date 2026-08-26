import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { NotificationBell } from "@/components/dashboard/notification-bell";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <DashboardSidebar user={session.user} />
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 hidden h-14 items-center justify-end border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-sm md:flex">
          <NotificationBell />
        </header>
        {children}
      </div>
    </div>
  );
}
