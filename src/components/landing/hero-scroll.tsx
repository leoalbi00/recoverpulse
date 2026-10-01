"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { AlertTriangle, ArrowRight, CreditCard, Lock, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";

const TRUST_BADGES = [
  { icon: Lock, label: "Crittografia SSL a 256-bit" },
  { icon: ShieldCheck, label: "GDPR Compliant" },
  { icon: CreditCard, label: "Stripe Compatible" },
];

/**
 * Hero: testo e CTA in alto, anteprima della dashboard subito sotto, nel
 * normale flusso del documento (nessun elemento sovrapposto, nessuna
 * altezza fissa). Lo scroll pilota solo la card: entra inclinata in
 * prospettiva 3D e si raddrizza ingrandendosi mentre arriva al centro dello
 * schermo. Su schermi bassi (variante `short:`, max-height 700px, es.
 * laptop 11-13") titolo, spaziature e card si riducono in proporzione. Con
 * prefers-reduced-motion la card resta piatta e ferma.
 */
export function HeroScroll() {
  const mockupRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // 0 = bordo superiore della card al fondo del viewport, 1 = card centrata.
  const { scrollYProgress } = useScroll({
    target: mockupRef,
    offset: ["start end", "center center"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  const rotateX = useTransform(progress, [0, 1], [reduceMotion ? 0 : 28, 0]);
  const scale = useTransform(progress, [0, 1], reduceMotion ? [1, 1] : [0.88, 1.04]);
  const glowOpacity = useTransform(progress, [0, 1], [0.3, 0.75]);

  return (
    <section className="relative overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_20%,transparent_75%)]"
      />

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-10 px-6 py-12 md:gap-14 md:py-20 short:gap-8 short:py-10">
        <div className="flex max-w-4xl flex-col items-center gap-6 text-center short:gap-4">
          <Badge
            variant="outline"
            className="h-auto gap-1.5 rounded-full border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-zinc-300"
          >
            <AlertTriangle className="size-3.5 text-amber-400" />
            Il churn involontario costa in media il 9% dell&apos;MRR
          </Badge>

          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance text-zinc-100 sm:text-4xl md:text-6xl md:leading-[1.05] short:md:text-5xl">
            Recupera fino al <span className="text-emerald-400">40% del fatturato</span> perso per
            pagamenti falliti.
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-pretty text-zinc-400 sm:text-lg short:sm:text-base">
            OmniRev intercetta ogni addebito rifiutato, ne classifica la causa, ritenta al momento giusto e
            invia al cliente un link 1-click per aggiornare la carta. Il tuo team non insegue nessuno.
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              size="lg"
              render={<a href="/start-trial" />}
              className="h-12 gap-2 rounded-full px-8 text-base font-semibold shadow-lg shadow-emerald-500/20"
            >
              Inizia Gratis
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<a href="#roi-calculator" />}
              className="h-12 rounded-full px-8 text-base font-medium"
            >
              Calcola quanto puoi recuperare
            </Button>
          </div>

          <div className="hidden flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:flex">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <Icon className="size-3.5 text-emerald-500/80" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div ref={mockupRef} className="relative w-full max-w-4xl [perspective:1400px] short:max-w-2xl">
          <motion.div
            aria-hidden
            style={{ opacity: glowOpacity }}
            className="pointer-events-none absolute inset-x-[10%] top-[15%] bottom-0 -z-10 rounded-full bg-emerald-500/25 blur-[120px]"
          />
          <motion.div
            style={{ rotateX, scale, transformOrigin: "50% 0%" }}
            className="mx-auto w-full max-w-full will-change-transform"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
