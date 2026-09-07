import Link from "next/link";
import { Check, CircleDashed, Mail } from "lucide-react";

import { cn } from "@/lib/utils";

type OnboardingStep = {
  label: string;
  description: string;
  done: boolean;
  href?: string;
};

/**
 * Guida i primi passi dopo /start-trial: Dati Legali/Fiscali → Connetti
 * Stripe → Sequenza Email (attiva di default, vedi src/lib/dunning-settings.ts
 * defaultSettings). Renderizzata solo finché i primi due step non sono
 * completi (vedi guard in src/app/dashboard/page.tsx) per non restare
 * d'intralcio agli account già operativi.
 */
export function OnboardingChecklist({
  profileComplete,
  stripeConnected,
}: {
  profileComplete: boolean;
  stripeConnected: boolean;
}) {
  const steps: OnboardingStep[] = [
    {
      label: "Completa Dati Legali/Fiscali",
      description: "Ragione sociale, Partita IVA e indirizzo, obbligatori per la fatturazione e i contratti.",
      done: profileComplete,
      href: "/dashboard/impostazioni#profilo-azienda",
    },
    {
      label: "Connetti il tuo account Stripe",
      description: "Un click autorizza RecoverPulse a leggere i pagamenti falliti e intervenire per te.",
      done: stripeConnected,
      href: "/dashboard/impostazioni#stripe",
    },
    {
      label: "Sequenza Solleciti Email",
      description: "Attiva di default con template pronti: nessuna configurazione richiesta per iniziare.",
      done: true,
    },
  ];

  return (
    <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
      <p className="text-sm font-semibold text-zinc-100">Completa la configurazione</p>
      <p className="mt-1 text-xs text-zinc-400">3 passaggi per iniziare a recuperare pagamenti falliti.</p>

      <ol className="mt-4 flex flex-col gap-3">
        {steps.map((step) => {
          const content = (
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors",
                step.done
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                  step.done ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-500",
                )}
              >
                {step.done ? <Check className="size-3.5" /> : <CircleDashed className="size-3.5" />}
              </span>
              <div className="min-w-0">
                <p className={cn("text-sm font-medium", step.done ? "text-emerald-200" : "text-zinc-200")}>
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">{step.description}</p>
              </div>
            </div>
          );

          return (
            <li key={step.label}>
              {step.href && !step.done ? (
                <Link href={step.href} className="block">
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
        <Mail className="size-3.5 shrink-0" />
        Solo il canale Email è attivo in Beta — SMS e WhatsApp arrivano nella versione Pro.
      </p>
    </section>
  );
}
