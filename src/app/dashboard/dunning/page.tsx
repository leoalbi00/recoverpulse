import { DunningTemplatesManager } from "@/components/dashboard/dunning-templates-manager";
import { getDunningTemplates } from "@/lib/dunning-templates";

export default function DunningPage() {
  const settings = getDunningTemplates();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Sequenze Dunning
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Automazione dei solleciti via email dopo un pagamento fallito: attiva
          o disattiva ogni passaggio e personalizza il modello di ciascuna
          email.
        </p>
      </div>

      <DunningTemplatesManager initialSettings={settings} />
    </main>
  );
}
