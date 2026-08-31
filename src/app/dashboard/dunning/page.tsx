import { DunningTemplatesManager } from "@/components/dashboard/dunning-templates-manager";
import { getDunningTemplates } from "@/lib/dunning-templates";

export default async function DunningPage() {
  const settings = await getDunningTemplates();

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Modelli Email
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Automazione dei solleciti via email dopo un pagamento fallito: attiva
          o disattiva ogni passaggio e personalizza il modello di ciascuna
          email.
        </p>
      </div>

      <DunningTemplatesManager initialSettings={settings} />
    </div>
  );
}
