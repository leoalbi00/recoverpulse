import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { listTransactions, type FailedTransaction } from "@/lib/transactions";
import { listAllDunningLogs } from "@/lib/dunning-logs";
import { getDunningTemplates } from "@/lib/dunning-templates";
import { getPaywallStatus } from "@/lib/paywall";
import { getMerchantSettings, isMerchantProfileComplete } from "@/lib/merchant-settings";
import { getConnectedAccountForUser } from "@/lib/connected-stripe-accounts";
import type { DunningLogEntry, SequenceStepDefinition } from "@/lib/dashboard-analytics";

/**
 * Carica transazioni, storico solleciti e step configurati da Supabase con
 * fallback puliti a liste vuote: se il DB non è raggiungibile, la pagina
 * mostra la dashboard con valori a zero invece di rompere il render del
 * Server Component (stesso principio di /dashboard/recuperi).
 */
async function loadDashboardData(userId: string): Promise<{
  allTransactions: FailedTransaction[];
  dunningLogs: DunningLogEntry[];
  sequenceSteps: SequenceStepDefinition[];
}> {
  // Le tre letture sono indipendenti: in parallelo per evitare un waterfall
  // di round-trip verso Supabase (stessi fallback di prima).
  const [allTransactions, dunningLogs, templates] = await Promise.all([
    listTransactions(userId).catch((error): FailedTransaction[] => {
      console.error("[dashboard] errore nel recupero delle transazioni:", error);
      return [];
    }),
    listAllDunningLogs(userId).catch((error): DunningLogEntry[] => {
      console.error("[dashboard] errore nel recupero dello storico solleciti:", error);
      return [];
    }),
    // getDunningTemplates() non lancia mai (fallback interno ai default),
    // vedi src/lib/dunning-templates.ts.
    getDunningTemplates(userId),
  ]);
  const sequenceSteps: SequenceStepDefinition[] = templates.steps.map((step) => ({
    id: step.id,
    label: step.label,
    delayDays: step.delayDays,
  }));

  return { allTransactions, dunningLogs, sequenceSteps };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const firstName = session.user.name?.split(" ")[0] ?? "Utente";

  // Query indipendenti tra loro: eseguite in parallelo (prima erano sequenziali).
  const [{ allTransactions, dunningLogs, sequenceSteps }, paywall, merchantSettings, connectedAccount] =
    await Promise.all([
      loadDashboardData(session.user.id),
      getPaywallStatus(session.user.id),
      getMerchantSettings(session.user.id),
      getConnectedAccountForUser(session.user.id).catch((error) => {
        console.error("[dashboard] errore nel recupero dell'account Stripe collegato:", error);
        return null;
      }),
    ]);
  const profileComplete = isMerchantProfileComplete(merchantSettings);
  const onboardingComplete = profileComplete && connectedAccount !== null;

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Bentornato, {firstName}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Ecco lo stato del recupero abbonamenti.</p>
      </div>

      {!onboardingComplete && (
        <OnboardingChecklist profileComplete={profileComplete} stripeConnected={connectedAccount !== null} />
      )}

      <DashboardOverview
        allTransactions={allTransactions}
        dunningLogs={dunningLogs}
        sequenceSteps={sequenceSteps}
        paywall={paywall}
      />
    </div>
  );
}
