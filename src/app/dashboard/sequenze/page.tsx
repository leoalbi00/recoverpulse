import { DunningSequencesPanel } from "@/components/dashboard/dunning-sequences-panel";
import { getDunningSettings } from "@/lib/dunning-settings";

export default async function SequenzePage() {
  const settings = await getDunningSettings();

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Sequenze Dunning
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Recupero automatico dei pagamenti falliti su WhatsApp, SMS ed Email.
        </p>
      </div>

      <DunningSequencesPanel initialSettings={settings} />
    </div>
  );
}
