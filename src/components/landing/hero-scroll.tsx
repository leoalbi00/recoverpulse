"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";
import { SecurityBadgeRow } from "@/components/landing/security-badges";

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
  const glowOpacity = useTransform(progress, [0, 0.6], [0.4, 0.9]);

  return (
    <section ref={containerRef} className="relative h-[200vh] sm:h-[230vh]">
      <div className="sticky top-0 flex h-svh flex-col items-center overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.07)_1px,transparent_0)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_20%,transparent_75%)]"
        />
        <motion.div
          aria-hidden
          style={{ opacity: glowOpacity }}
          className="absolute top-1/3 left-1/2 -z-10 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[140px]"
        />

        {/* Su laptop 11-15" l'altezza utile è spesso 650-760px: sotto gli 800px
            di altezza compattiamo spaziature e titolo, così testo e CTA non
            finiscono sotto l'anteprima della dashboard. */}
        <motion.div
          style={{ opacity: headlineOpacity, y: headlineY }}
          className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-12 text-center sm:pt-20 [@media(max-height:800px)]:pt-8"
        >
          <Badge
            variant="outline"
            className="h-auto gap-1.5 rounded-full bg-card px-3 py-1.5 text-slate-700 shadow-sm"
          >
            <AlertTriangle className="size-3.5 text-amber-600" />
            Il churn involontario costa in media il 9% dell&apos;MRR
          </Badge>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl xl:text-6xl [@media(max-height:800px)]:mt-4 [@media(max-height:800px)]:sm:text-5xl">
            Riduci il <span className="text-emerald-700">churn involontario</span> da pagamenti rifiutati
            su Stripe.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg [@media(max-height:800px)]:mt-3">
            OmniRev recupera fino al 40% del fatturato perso: classifica ogni rifiuto, ritenta l&apos;addebito
            al momento giusto e manda al cliente un link 1-click per aggiornare la carta. Il tuo team non
            insegue nessuno.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row [@media(max-height:800px)]:mt-5">
            <Button
              size="lg"
              render={<a href="/start-trial" />}
              className="h-12 gap-2 rounded-full px-8 text-base font-semibold shadow-lg shadow-slate-900/10"
            >
              Inizia il recupero gratuito
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<a href="#roi-calculator" />}
              className="h-12 rounded-full px-8 text-base font-medium"
            >
              Calcola quanto stai perdendo
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Gratis durante la Beta · Nessuna carta di credito · Stripe collegato in 1 click
          </p>

          <SecurityBadgeRow className="mt-4 hidden sm:flex [@media(max-height:720px)]:hidden" />
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 flex justify-center px-4 [perspective:1400px] sm:px-6">
          <motion.div
            style={{ rotateX, scale, y: cardY, transformOrigin: "50% 100%" }}
            className="w-full max-w-3xl translate-y-[38%] will-change-transform sm:translate-y-[30%] [@media(max-height:800px)]:sm:translate-y-[46%]"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
