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

  // Cornice bicolore: pagina, header e sidebar restano scuri (bg-zinc-950,
  // testo text-zinc-100), mentre ogni card/tabella/modulo al loro interno è
  // un riquadro bianco con testo scuro (vedi i singoli componenti sotto
  // src/components/dashboard/ e le pagine sotto src/app/dashboard/).
  // L'header desktop è "sticky" con effetto glassmorphism (sfondo
  // semi-trasparente bg-zinc-950/80 + backdrop-blur-md).
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
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
        <header className="sticky top-0 z-50 hidden w-full items-center justify-end border-b border-zinc-800/60 bg-zinc-950/80 p-4 backdrop-blur-md transition-all md:flex">
          <NotificationBell />
        </header>
        <main className="flex-1 p-6 md:p-8 pt-8 space-y-6 bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}
