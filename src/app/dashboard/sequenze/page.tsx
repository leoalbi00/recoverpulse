import { DunningSequencesPanel } from "@/components/dashboard/dunning-sequences-panel";
import { getDunningSettings } from "@/lib/dunning-settings";

export default function SequenzePage() {
  const settings = getDunningSettings();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Sequenze Dunning
        </h1>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          Recupero automatico dei pagamenti falliti su WhatsApp, SMS ed Email.
        </p>
      </div>

      <DunningSequencesPanel initialSettings={settings} />
    </main>
  );
}
