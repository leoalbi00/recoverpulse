import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { listPilotRequests } from "@/lib/pilot-requests";
import { listGlobalDunningLogs } from "@/lib/dunning-logs";

const LIST_LIMIT = 200;

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const CHANNEL_LABEL: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

const STATUS_LABEL: Record<string, string> = {
  sent: "Inviato",
  failed: "Fallito",
};

export default async function DeveloperPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Guardia lato server indipendente dallo switch "Vista Sviluppatore" della
  // sidebar (quello è solo una preferenza di visualizzazione client-side):
  // questa pagina resta accessibile solo all'account admin, a prescindere
  // dallo stato del toggle o da un accesso diretto all'URL.
  if (!isAdminEmail(session.user.email)) redirect("/dashboard");

  let pilotRequests: Awaited<ReturnType<typeof listPilotRequests>> = [];
  let systemLogs: Awaited<ReturnType<typeof listGlobalDunningLogs>> = [];

  try {
    [pilotRequests, systemLogs] = await Promise.all([
      listPilotRequests(LIST_LIMIT),
      listGlobalDunningLogs(LIST_LIMIT),
    ]);
  } catch (error) {
    console.error("[dashboard/developer] errore nel recupero dei dati:", error);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Vista Sviluppatore
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Richieste di integrazione pilota ricevute e log di sistema globali, su tutti gli account.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-zinc-100">
          Richieste Integrazione Pilota{" "}
          <span className="text-sm font-normal text-zinc-500">({pilotRequests.length})</span>
        </h2>

        <div className="mt-4 rounded-xl border border-zinc-200/80 bg-white p-4 text-zinc-900 shadow-md sm:p-6">
          {pilotRequests.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">
              Nessuna richiesta pilota ricevuta al momento.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200/80 text-xs uppercase tracking-wide text-zinc-600">
                    <th className="px-3 pb-3 font-medium first:pl-0">Nome</th>
                    <th className="px-3 pb-3 font-medium">Email</th>
                    <th className="px-3 pb-3 font-medium">Azienda</th>
                    <th className="px-3 pb-3 font-medium">MRR stimato</th>
                    <th className="px-3 pb-3 font-medium last:pr-0">Ricevuta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {pilotRequests.map((request) => (
                    <tr key={request.id} className="transition-colors hover:bg-zinc-100">
                      <td className="px-3 py-3 font-medium text-zinc-900 first:pl-0">{request.name}</td>
                      <td className="px-3 py-3 text-zinc-600">{request.email}</td>
                      <td className="px-3 py-3 text-zinc-600">{request.company}</td>
                      <td className="px-3 py-3 text-zinc-600">{request.estimatedMrr ?? "—"}</td>
                      <td className="px-3 py-3 text-zinc-600 last:pr-0">
                        {formatDateTime(request.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-100">
          Log di Sistema{" "}
          <span className="text-sm font-normal text-zinc-500">({systemLogs.length})</span>
        </h2>

        <div className="mt-4 rounded-xl border border-zinc-200/80 bg-white p-4 text-zinc-900 shadow-md sm:p-6">
          {systemLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">
              Nessun log di sistema registrato al momento.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200/80 text-xs uppercase tracking-wide text-zinc-600">
                    <th className="px-3 pb-3 font-medium first:pl-0">Fattura</th>
                    <th className="px-3 pb-3 font-medium">Destinatario</th>
                    <th className="px-3 pb-3 font-medium">Canale</th>
                    <th className="px-3 pb-3 font-medium">Step</th>
                    <th className="px-3 pb-3 font-medium">Esito</th>
                    <th className="px-3 pb-3 font-medium last:pr-0">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {systemLogs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-zinc-100">
                      <td className="px-3 py-3 font-mono text-xs text-zinc-700 first:pl-0">
                        {log.invoiceId}
                      </td>
                      <td className="px-3 py-3 text-zinc-600">{log.customerEmail}</td>
                      <td className="px-3 py-3 text-zinc-600">
                        {CHANNEL_LABEL[log.channel] ?? log.channel}
                      </td>
                      <td className="px-3 py-3 text-zinc-600">Giorno {log.stepDays}</td>
                      <td className="px-3 py-3 text-zinc-600">
                        {STATUS_LABEL[log.status] ?? log.status}
                      </td>
                      <td className="px-3 py-3 text-zinc-600 last:pr-0">
                        {formatDateTime(log.sentAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
