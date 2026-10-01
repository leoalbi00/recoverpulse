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
 * Hero in scrollytelling: il titolo resta in primo piano all'inizio, poi
 * l'anteprima della dashboard si raddrizza dalla prospettiva 3D e si
 * ingrandisce fino a occupare lo schermo mentre il testo sfuma. Con
 * prefers-reduced-motion la dashboard resta piatta e ferma.
 */
export function HeroScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  const rotateX = useTransform(progress, [0, 0.6], [reduceMotion ? 0 : 32, 0]);
  const scale = useTransform(progress, [0, 0.6, 1], reduceMotion ? [1, 1, 1] : [0.82, 1.08, 1.14]);
  const cardY = useTransform(progress, [0, 0.6], reduceMotion ? ["0%", "0%"] : ["10%", "-32%"]);
  const headlineOpacity = useTransform(progress, [0, 0.3], [1, 0]);
  const headlineY = useTransform(progress, [0, 0.3], [0, -80]);
  const glowOpacity = useTransform(progress, [0, 0.6], [0.35, 0.8]);

  return (
    <section ref={containerRef} className="relative h-[200vh] sm:h-[230vh]">
      <div className="sticky top-0 flex h-svh flex-col items-center overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_20%,transparent_75%)]"
        />
        <motion.div
          aria-hidden
          style={{ opacity: glowOpacity }}
          className="absolute top-1/3 left-1/2 -z-10 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-emerald-500/25 blur-[140px]"
        />

        <motion.div
          style={{ opacity: headlineOpacity, y: headlineY }}
          className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-14 text-center sm:pt-20"
        >
          <Badge
            variant="outline"
            className="h-auto gap-1.5 rounded-full border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-zinc-300"
          >
            <AlertTriangle className="size-3.5 text-amber-400" />
            Il churn involontario costa in media il 9% dell&apos;MRR
          </Badge>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-zinc-100 sm:text-6xl">
            Recupera fino al <span className="text-emerald-400">40% del fatturato</span> perso per
            pagamenti falliti.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-zinc-400 sm:text-lg">
            OmniRev intercetta ogni addebito rifiutato, ne classifica la causa, ritenta al momento giusto e
            invia al cliente un link 1-click per aggiornare la carta. Il tuo team non insegue nessuno.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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

          <div className="mt-5 hidden flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:flex">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <Icon className="size-3.5 text-emerald-500/80" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 flex justify-center px-4 [perspective:1400px] sm:px-6">
          <motion.div
            style={{ rotateX, scale, y: cardY, transformOrigin: "50% 100%" }}
            className="w-full max-w-3xl translate-y-[38%] will-change-transform sm:translate-y-[30%]"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
