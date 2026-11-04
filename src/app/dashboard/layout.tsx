import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { getTrialStatus } from "@/lib/trial";
import { getConnectedAccountForUser } from "@/lib/connected-stripe-accounts";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [trial, connectedAccount] = await Promise.all([
    getTrialStatus(session.user.id),
    getConnectedAccountForUser(session.user.id),
  ]);

  // Tema chiaro (scope `light`, vedi globals.css): pagina su bg-muted
  // (#F8FAFC), sidebar e card bianche con bordo slate-200, così le card si
  // staccano dallo sfondo senza ombre pesanti. L'header desktop è "sticky"
  // con effetto glassmorphism (bg-muted/80 + backdrop-blur-md).
  return (
    <div className="light min-h-screen bg-muted text-foreground">
      <DashboardSidebar
        user={session.user}
        connectedStripeAccount={
          connectedAccount
            ? { stripeAccountId: connectedAccount.stripeAccountId, livemode: connectedAccount.livemode }
            : null
        }
      />
      <div className="flex flex-col md:pl-64">
        <TrialBanner trial={trial} />
        <header className="sticky top-0 z-50 hidden w-full items-center justify-end border-b border-border bg-muted/80 p-4 backdrop-blur-md transition-all md:flex">
          <NotificationBell />
        </header>
        <main className="flex-1 space-y-6 p-6 pt-8 md:p-8">
          {children}
        </main>
        <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-6 py-5 text-xs text-muted-foreground md:px-8">
          <a href="/termini" className="hover:text-foreground">
            Termini di servizio
          </a>
          <a href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </a>
          <a href="/dpa" className="hover:text-foreground">
            DPA
          </a>
          <a href="/cookie" className="hover:text-foreground">
            Cookie Policy
          </a>
        </footer>
      </div>
    </div>
  );
}
