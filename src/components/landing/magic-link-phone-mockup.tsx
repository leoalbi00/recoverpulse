"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { CheckCircle2, CreditCard, Link2, Mail, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Coriandoli "metallici": oro, argento, platino e smeraldo del brand.
const METALLIC_COLORS = ["#d4af37", "#f5e6a8", "#c0c0c0", "#e5e4e2", "#10b981", "#6ee7b7"];

const STEPS = [
  { icon: Mail, title: "Email di recupero inviata", detail: "Pochi secondi dopo il rifiuto, col brand del merchant." },
  { icon: Link2, title: "Il cliente apre il Magic Link", detail: "Nessun login: link personale, monouso e a scadenza." },
  { icon: CreditCard, title: "Nuova carta in 1 click", detail: "Inserisce la nuova carta e l'addebito riparte subito." },
];

/**
 * Terza scena: lo smartphone del cliente riceve la notifica di pagamento
 * fallito, che a metà scroll diventa "pagamento recuperato" con una sola
 * esplosione di coriandoli (non ripetuta tornando indietro con lo scroll,
 * mai con prefers-reduced-motion).
 */
export function MagicLinkPhoneMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);
  const [recovered, setRecovered] = useState(false);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = value > 0.5;
    setRecovered((current) => (current === next ? current : next));
  });

  useEffect(() => {
    if (!recovered || firedRef.current || reduceMotion) return;
    firedRef.current = true;

    const rect = phoneRef.current?.getBoundingClientRect();
    const origin = rect
      ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height * 0.3) / window.innerHeight }
      : { x: 0.5, y: 0.4 };

    // Import dinamico: canvas-confetti tocca `window`, e serve solo al primo recupero.
    void import("canvas-confetti").then(({ default: confetti }) => {
      const shared = { colors: METALLIC_COLORS, origin, disableForReducedMotion: true, scalar: 1.1 };
      confetti({ ...shared, particleCount: 90, spread: 70, startVelocity: 42, shapes: ["square"] });
      confetti({ ...shared, particleCount: 60, spread: 120, startVelocity: 30, decay: 0.92, shapes: ["circle"] });
    });
  }, [recovered, reduceMotion]);

  return (
    <section ref={containerRef} aria-labelledby="magic-link-title" className="relative h-[220vh]">
      {/* pt-24 = altezza della navbar sticky (banner Beta + barra da 64px); min-h-fit
          lascia crescere il riquadro invece di tagliare il contenuto su schermi bassi. */}
      <div className="sticky top-0 flex h-svh min-h-fit items-center overflow-hidden pt-24 pb-6 short:pb-4">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-6 lg:grid-cols-2 lg:gap-16 short:gap-5">
          <div className="order-2 lg:order-1">
            <Badge
              variant="outline"
              className="h-auto rounded-full border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300"
            >
              Magic Link 1-Click
            </Badge>
            <h2
              id="magic-link-title"
              className="mt-4 text-3xl font-semibold tracking-tight text-balance text-zinc-100 sm:text-4xl short:mt-3 short:text-2xl short:sm:text-3xl"
            >
              Dal rifiuto al recupero, senza che il tuo team muova un dito
            </h2>
            <ul className="mt-8 hidden flex-col gap-5 sm:flex short:mt-5 short:gap-3">
              {STEPS.map(({ icon: Icon, title, detail }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
                    <Icon className="size-4.5 text-emerald-400" />
                  </span>
                  <div>
                    <p className="font-medium text-zinc-100">{title}</p>
                    <p className="mt-0.5 text-sm text-zinc-400">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="order-1 flex justify-center lg:order-2">
            <Phone ref={phoneRef} recovered={recovered} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Phone({ recovered, ref }: { recovered: boolean; ref: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className="relative h-[460px] w-[230px] rounded-[2.75rem] border border-zinc-700 bg-zinc-900 p-2.5 shadow-2xl shadow-black/60 sm:h-[560px] sm:w-[280px] short:h-[380px] short:w-[190px] short:sm:h-[440px] short:sm:w-[220px]"
    >
      <div
        aria-hidden
        className={cn(
          "absolute -inset-10 -z-10 rounded-full blur-3xl transition-colors duration-700",
          recovered ? "bg-emerald-500/25" : "bg-rose-500/20"
        )}
      />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[2.25rem] bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950">
        <div aria-hidden className="mx-auto mt-2.5 h-6 w-24 rounded-full bg-black" />

        <div className="mt-8 text-center text-white short:mt-4">
          <p className="text-5xl font-light tabular-nums sm:text-6xl short:text-4xl short:sm:text-5xl">9:41</p>
          <p className="mt-1 text-xs text-zinc-400">giovedì 1 ottobre</p>
        </div>

        <div className="mt-8 px-3 short:mt-4" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={recovered ? "recovered" : "failed"}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={cn(
                "rounded-2xl p-3.5 backdrop-blur-md",
                recovered ? "bg-emerald-500/90 text-emerald-950" : "bg-rose-500/90 text-white"
              )}
            >
              <div className="flex items-center gap-2 text-[11px] font-medium opacity-80">
                {recovered ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                {recovered ? "Acme SaaS · ora" : "Acme SaaS · 1 min fa"}
              </div>
              <p className="mt-1.5 text-sm font-semibold">
                {recovered ? "Pagamento recuperato" : "Pagamento non riuscito"}
              </p>
              <p className="mt-0.5 text-xs leading-snug opacity-90">
                {recovered
                  ? "Grazie! $299.00 addebitati sulla nuova carta. Il tuo piano Growth resta attivo."
                  : "La tua carta è scaduta. Aggiornala in 1 click per non perdere l'accesso a Growth."}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-auto px-6 pb-6 short:px-4 short:pb-4">
          <div
            className={cn(
              "flex h-11 items-center justify-center rounded-xl px-2 text-center text-sm leading-tight font-semibold whitespace-nowrap transition-colors duration-500 short:text-[11px]",
              recovered ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40" : "bg-white text-zinc-900"
            )}
          >
            {recovered ? "Abbonamento attivo ✓" : "Aggiorna Carta in 1-Click"}
          </div>
          <div aria-hidden className="mx-auto mt-5 h-1 w-28 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
}
