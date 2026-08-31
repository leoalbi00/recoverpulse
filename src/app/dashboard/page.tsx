import { auth } from "@/auth";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { listTransactions, type FailedTransaction } from "@/lib/transactions";
import { listAllDunningLogs } from "@/lib/dunning-logs";
import { getDunningTemplates } from "@/lib/dunning-templates";
import type { DunningLogEntry, SequenceStepDefinition } from "@/lib/dashboard-analytics";

/**
 * Carica transazioni, storico solleciti e step configurati da Supabase con
 * fallback puliti a liste vuote: se il DB non è raggiungibile, la pagina
 * mostra la dashboard con valori a zero invece di rompere il render del
 * Server Component (stesso principio di /dashboard/transazioni).
 */
async function loadDashboardData(): Promise<{
  allTransactions: FailedTransaction[];
  dunningLogs: DunningLogEntry[];
  sequenceSteps: SequenceStepDefinition[];
}> {
  let allTransactions: FailedTransaction[] = [];
  try {
    allTransactions = await listTransactions();
  } catch (error) {
    console.error("[dashboard] errore nel recupero delle transazioni:", error);
  }

  let dunningLogs: DunningLogEntry[] = [];
  try {
    dunningLogs = await listAllDunningLogs();
  } catch (error) {
    console.error("[dashboard] errore nel recupero dello storico solleciti:", error);
  }

  // getDunningTemplates() non lancia mai (fallback interno ai default),
  // vedi src/lib/dunning-templates.ts.
  const templates = await getDunningTemplates();
  const sequenceSteps: SequenceStepDefinition[] = templates.steps.map((step) => ({
    id: step.id,
    label: step.label,
    delayDays: step.delayDays,
  }));

  return { allTransactions, dunningLogs, sequenceSteps };
}

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Utente";

  const { allTransactions, dunningLogs, sequenceSteps } = await loadDashboardData();

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Bentornato, {firstName}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">Ecco lo stato del recupero abbonamenti.</p>
      </div>

      <DashboardOverview allTransactions={allTransactions} dunningLogs={dunningLogs} sequenceSteps={sequenceSteps} />
    </div>
  );
}
