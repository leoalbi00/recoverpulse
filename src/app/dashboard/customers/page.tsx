import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CustomersExplorer } from "@/components/dashboard/customers-explorer";
import { listTransactions, type FailedTransaction } from "@/lib/transactions";
import { computeCustomerProfiles } from "@/lib/dashboard-analytics";

export default async function CustomersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let transactions: FailedTransaction[] = [];
  try {
    transactions = await listTransactions(session.user.id);
  } catch (error) {
    console.error("[dashboard/customers] errore nel recupero delle transazioni:", error);
  }

  const customers = computeCustomerProfiles(transactions);

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Clienti
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Profilazione economica dei clienti gestiti: fatturato storico,
          incassato e stato delle fatture. Clicca su un cliente per il
          dettaglio.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200/80 bg-white text-zinc-900 p-6 shadow-md">
        <CustomersExplorer customers={customers} />
      </div>
    </div>
  );
}
