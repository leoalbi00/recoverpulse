import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const PROBLEM_POINTS = [
  "Il pagamento fallisce in silenzio: nessun avviso, nessun follow-up.",
  "Il cliente non si accorge di nulla finché non perde l'accesso al servizio.",
  "Stripe riprova automaticamente 2-3 volte, poi l'abbonamento viene cancellato.",
  "Il tuo team scopre il mancato incasso solo guardando i report a fine mese.",
  "Ogni cliente perso così va rincorso manualmente via email o telefono.",
];

const SOLUTION_POINTS = [
  "Il fallimento viene intercettato all'istante via webhook Stripe.",
  "Parte subito una sequenza automatica su WhatsApp, SMS ed Email.",
  "Ogni messaggio include un link 1-click sicuro per aggiornare la carta.",
  "Il pagamento viene riaddebitato in automatico appena la carta è aggiornata.",
  "Il tuo team vede tutto in dashboard, senza muovere un dito.",
];

export function ProblemSolution() {
  return (
    <section className="relative scroll-mt-16 py-28 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="outline"
            className="h-auto rounded-full border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-300"
          >
            Il problema
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            Il churn involontario è invisibile, finché non conti i ricavi persi
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            Carte scadute, fondi insufficienti, banche che rifiutano l&apos;addebito:
            ogni mese una fetta del tuo MRR sparisce senza che nessun cliente
            abbia davvero deciso di lasciarti.
          </p>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-16">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-rose-500/10 ring-1 ring-rose-500/20">
                <XCircle className="size-5 text-rose-400" />
              </span>
              <div>
                <p className="text-xs font-medium tracking-wide text-rose-400 uppercase">Senza RecoverPulse</p>
                <p className="text-lg font-semibold text-zinc-100">Carta Scaduta</p>
              </div>
            </div>
            <ul className="mt-6 flex flex-col gap-3.5">
              {PROBLEM_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-zinc-400">
                  <XCircle className="mt-0.5 size-4 shrink-0 text-rose-500/70" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Divisore "VS": in flusso normale tra le due card su mobile (dove
              sono impilate, zero rischio di sovrapposizione), assoluto e
              centrato via flexbox sull'intero riquadro della griglia su
              desktop — il gap tra le colonne (lg:gap-16) è più largo del
              cerchio (size-12) apposta, così il cerchio resta sempre
              interamente nello spazio vuoto tra le due card, senza mai
              invadere spunte, icone o testo di nessuna delle due. */}
          <div
            aria-hidden
            className="flex items-center gap-3 lg:absolute lg:inset-0 lg:z-10 lg:justify-center lg:gap-0"
          >
            <span className="h-px flex-1 bg-zinc-800 lg:hidden" />
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-xs font-semibold text-zinc-500">
              VS
            </span>
            <span className="h-px flex-1 bg-zinc-800 lg:hidden" />
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <CheckCircle2 className="size-5 text-emerald-400" />
              </span>
              <div>
                <p className="text-xs font-medium tracking-wide text-emerald-400 uppercase">Con RecoverPulse</p>
                <p className="text-lg font-semibold text-zinc-100">Sollecito Automatico</p>
              </div>
            </div>
            <ul className="mt-6 flex flex-col gap-3.5">
              {SOLUTION_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  {point}
                </li>
              ))}
            </ul>
            <a
              href="#roi-calculator"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Scopri quanto puoi recuperare
              <ArrowRight className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
