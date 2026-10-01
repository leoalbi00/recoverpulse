"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { BrainCircuit, CalendarClock, CreditCard, Loader2, Send, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Stage = 0 | 1 | 2;

const STAGES: { label: string; title: string; description: string }[] = [
  {
    label: "01 · Addebito",
    title: "Rinnovo mensile in corso",
    description: "Stripe tenta il rinnovo dell'abbonamento Growth del tuo cliente: $299.00.",
  },
  {
    label: "02 · Rifiuto",
    title: "La banca rifiuta il pagamento",
    description:
      "Senza OmniRev qui inizia il churn silenzioso: nessun avviso, il cliente perde l'accesso senza saperlo.",
  },
  {
    label: "03 · Diagnosi",
    title: "OmniRev ne capisce la causa",
    description:
      "Il codice di rifiuto viene classificato in tempo reale e decide la strategia: Magic Link immediato o riaddebito programmato.",
  },
];

const CAUSES = [
  { code: "expired_card", label: "Carta scaduta", strategy: "Magic Link immediato", active: true },
  { code: "insufficient_funds", label: "Fondi insufficienti", strategy: "Nuovo tentativo programmato", active: false },
];

/**
 * Seconda scena dello scrollytelling: lo scroll guida tre stati della stessa
 * fattura da $299.00 (addebito → rifiuto → diagnosi). Il contenuto di ogni
 * stato è sempre nel DOM per screen reader e motori di ricerca; l'animazione
 * cambia solo quale stato è evidenziato.
 */
export function SimulationSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage>(0);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next: Stage = value < 0.3 ? 0 : value < 0.62 ? 1 : 2;
    setStage((current) => (current === next ? current : next));
  });

  return (
    <section ref={containerRef} aria-labelledby="simulation-title" className="relative h-[260vh]">
      {/* pt-24 = altezza della navbar sticky (banner Beta + barra da 64px); min-h-fit
          lascia crescere il riquadro invece di tagliare il contenuto su schermi bassi. */}
      <div className="sticky top-0 flex h-svh min-h-fit items-center overflow-hidden pt-24 pb-6 short:pb-4">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16 short:gap-6">
          <div>
            <Badge
              variant="outline"
              className="h-auto rounded-full border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-300 max-lg:hidden"
            >
              Simulazione live
            </Badge>
            <h2
              id="simulation-title"
              className="mt-4 text-3xl font-semibold tracking-tight text-balance text-zinc-100 sm:text-4xl short:text-2xl short:sm:text-3xl"
            >
              Cosa succede quando un pagamento fallisce
            </h2>

            <ol className="mt-6 flex flex-col gap-3 lg:mt-10 short:mt-4 short:lg:mt-5">
              {STAGES.map((item, index) => (
                <li
                  key={item.label}
                  aria-current={stage === index ? "step" : undefined}
                  className={cn(
                    "rounded-xl border px-4 py-3 transition-all duration-500 sm:px-5 sm:py-4",
                    stage === index
                      ? "border-zinc-700 bg-zinc-900/80 opacity-100"
                      : "hidden border-transparent opacity-40 lg:block short:lg:hidden"
                  )}
                >
                  <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">{item.label}</p>
                  <p className="mt-1 text-base font-semibold text-zinc-100">{item.title}</p>
                  <p
                    className={cn(
                      "text-sm leading-relaxed text-zinc-400 transition-all duration-500 max-sm:short:hidden",
                      stage === index ? "mt-1 max-h-24" : "max-h-0 overflow-hidden lg:mt-1 lg:max-h-24"
                    )}
                  >
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <InvoiceCard stage={stage} />
        </div>
      </div>
    </section>
  );
}

function InvoiceCard({ stage }: { stage: Stage }) {
  const failed = stage >= 1;
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        aria-hidden
        className={cn(
          "absolute -inset-8 -z-10 rounded-[2.5rem] blur-3xl transition-colors duration-700",
          failed ? "bg-rose-500/15" : "bg-sky-500/10"
        )}
      />

      {/* Carta "Enterprise Light": contrasto netto con lo sfondo scuro per
          richiamare un documento contabile reale. */}
      <motion.div
        animate={stage === 1 && !reduceMotion ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-2xl bg-white text-zinc-900 shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 short:py-3">
          <div>
            <p className="text-xs text-zinc-500">Fattura</p>
            <p className="font-mono text-sm font-medium">in_1Q8x2LZv · Growth</p>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {failed ? (
              <motion.span
                key="failed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-200"
              >
                <XCircle className="size-3.5" />
                Rifiutato
              </motion.span>
            ) : (
              <motion.span
                key="pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200"
              >
                <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
                In elaborazione
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="px-6 py-6 short:py-4">
          <p className="text-sm text-zinc-500">Importo</p>
          <p
            className={cn(
              "mt-1 text-5xl font-semibold tracking-tight tabular-nums short:text-4xl transition-colors duration-500",
              failed ? "text-rose-600" : "text-zinc-900"
            )}
          >
            $299.00
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
            <CreditCard className="size-4" />
            Visa •••• 4242 · scad. 09/26
          </div>
        </div>

        <div
          className={cn(
            "grid transition-all duration-500",
            stage === 2 ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-5 short:py-3">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                <BrainCircuit className="size-4 text-emerald-600" />
                Diagnosi OmniRev
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {CAUSES.map((cause) => (
                  <li
                    key={cause.code}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-sm",
                      cause.active
                        ? "bg-white font-medium text-zinc-900 shadow-sm ring-2 ring-emerald-500"
                        : "text-zinc-400"
                    )}
                  >
                    <span className="flex flex-col">
                      {cause.label}
                      <span className="font-mono text-[11px] font-normal text-zinc-400">{cause.code}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs">
                      {cause.active ? <Send className="size-3.5" /> : <CalendarClock className="size-3.5" />}
                      {cause.strategy}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
