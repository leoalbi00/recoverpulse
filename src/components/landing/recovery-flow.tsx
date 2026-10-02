"use client";

import { useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { useInView, useReducedMotion } from "framer-motion";
import { BrainCircuit, CalendarClock, Landmark, Link2, ShieldCheck, Workflow } from "lucide-react";

import { AnimatedBeam } from "@/components/ui/animated-beam";
import { SectionHeading } from "@/components/landing/section-heading";

const SOURCES = [
  { name: "Stripe", detail: "expired_card", amount: "€299" },
  { name: "PayPal", detail: "funding_failed", amount: "€89" },
  { name: "SEPA", detail: "insufficient_funds", amount: "€149" },
];

const ENGINE_STEPS = [
  { icon: ShieldCheck, label: "Stop-Slot: dati di pagamento verificati" },
  { icon: BrainCircuit, label: "Diagnosi del codice di rifiuto" },
  { icon: CalendarClock, label: "Riaddebito programmato con backoff" },
  { icon: Link2, label: "Magic Link 1-click al cliente" },
];

// Ogni passaggio del raggio "deposita" una fattura recuperata nel contatore.
const BEAM_SECONDS = 3;
const RECOVERED_AMOUNTS = [299, 89, 149];
const START_TOTAL = 12480;

function NodeCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full rounded-xl border border-white/10 bg-zinc-950/80 backdrop-blur-md ${className}`}>
      {children}
    </div>
  );
}

/**
 * "Animated Beam": i pagamenti falliti sui gateway (sinistra) confluiscono
 * nel motore OmniRev (centro) e, una volta recuperati, arrivano sul conto
 * del merchant (destra). Da lg in su il flusso è orizzontale; sotto è una
 * colonna verticale con gli stessi connettori ruotati. Tutti i blocchi sono
 * celle di layout: nessun elemento è posizionato sopra un altro.
 */
export function RecoveryFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const reduceMotion = useReducedMotion();
  const [total, setTotal] = useState(START_TOTAL);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    let index = 0;
    const id = window.setInterval(() => {
      setTotal((value) => value + RECOVERED_AMOUNTS[index % RECOVERED_AMOUNTS.length]);
      index += 1;
    }, BEAM_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [inView, reduceMotion]);

  const sourceLinks = [1 / 6, 1 / 2, 5 / 6].map((from) => ({ from, to: 0.5 }));

  return (
    <section id="come-funziona" aria-labelledby="flow-title" className="scroll-mt-24 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 md:gap-16">
        <SectionHeading
          id="flow-title"
          eyebrow="Come funziona"
          icon={Workflow}
          title="Dal pagamento bloccato al tuo conto, in sicurezza"
          description="Ogni addebito rifiutato viene validato, diagnosticato e recuperato in automatico. I fondi arrivano sul tuo conto tramite il tuo gateway: OmniRev non tocca mai il denaro."
        />

        <div
          ref={ref}
          className="flex flex-col items-stretch lg:grid lg:grid-cols-[minmax(0,13rem)_minmax(2.5rem,1fr)_minmax(0,17rem)_minmax(2.5rem,1fr)_minmax(0,13rem)] lg:items-stretch"
        >
          {/* Gateway: 3 colonne su mobile, 3 righe uguali da lg (centri a 1/6, 1/2, 5/6). */}
          <ul className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:grid-rows-3 lg:gap-0">
            {SOURCES.map((source) => (
              <li key={source.name} className="flex items-center lg:py-2">
                <NodeCard className="p-3">
                  <p className="text-sm font-semibold text-zinc-100">{source.name}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-rose-300/80">{source.detail}</p>
                  <p className="mt-1 text-xs text-zinc-500 tabular-nums">{source.amount} bloccati</p>
                </NodeCard>
              </li>
            ))}
          </ul>

          <AnimatedBeam links={sourceLinks} direction="vertical" duration={BEAM_SECONDS} className="h-14 lg:hidden" />
          <AnimatedBeam links={sourceLinks} duration={BEAM_SECONDS} className="hidden lg:block" />

          <div className="flex items-center">
            <NodeCard className="border-emerald-500/30 p-5 shadow-[0_0_48px_-16px_rgb(16_185_129/0.45)]">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30">
                  <BrainCircuit className="size-4 text-emerald-400" />
                </span>
                <p className="text-sm font-semibold text-zinc-100">OmniRev Engine</p>
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {ENGINE_STEPS.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-start gap-2 text-xs leading-snug text-zinc-400">
                    <Icon className="mt-px size-3.5 shrink-0 text-emerald-400/80" />
                    {label}
                  </li>
                ))}
              </ul>
            </NodeCard>
          </div>

          <AnimatedBeam
            links={[{ from: 0.5, to: 0.5 }]}
            direction="vertical"
            duration={BEAM_SECONDS}
            className="h-14 lg:hidden"
          />
          <AnimatedBeam links={[{ from: 0.5, to: 0.5 }]} duration={BEAM_SECONDS} className="hidden lg:block" />

          <div className="flex items-center">
            <NodeCard className="p-5">
              <div className="flex items-center gap-2">
                <Landmark className="size-4 text-zinc-300" />
                <p className="text-sm font-semibold text-zinc-100">Il tuo conto</p>
              </div>
              <NumberFlow
                value={total}
                locales="it-IT"
                format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
                className="mt-3 text-2xl font-semibold tracking-tight text-emerald-400 tabular-nums"
              />
              <p className="mt-1 text-xs text-zinc-500">recuperati questo mese</p>
            </NodeCard>
          </div>
        </div>
      </div>
    </section>
  );
}
