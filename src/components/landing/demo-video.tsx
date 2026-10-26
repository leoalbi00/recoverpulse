"use client";

import { Player } from "@remotion/player";
import { useReducedMotion } from "framer-motion";
import { PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DEMO_VIDEO, VideoComposition } from "@/remotion/video-composition";

/**
 * Video-demo generata in codice (src/remotion/video-composition.tsx) e
 * riprodotta dal vivo con @remotion/player: nessun MP4 da ospitare, il
 * contenuto resta sempre allineato al prodotto. Lo stesso componente si
 * esporta in MP4 con `npm run video:render`.
 */
export function DemoVideo() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="demo" aria-labelledby="demo-title" className="relative scroll-mt-16 py-28 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="outline"
            className="h-auto gap-1.5 rounded-full bg-card px-3 py-1 text-slate-700"
          >
            <PlayCircle className="size-3.5 text-emerald-600" />
            Demo in 12 secondi
          </Badge>
          <h2 id="demo-title" className="mt-4 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
            Il motore di recupero, in azione
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Dal codice di rifiuto della banca al pagamento recuperato: ecco cosa fa OmniRev per ogni
            singola fattura fallita, in automatico.
          </p>
        </div>

        <div className="relative mt-14">
          <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-emerald-500/10 blur-3xl" />
          <div className="overflow-hidden rounded-2xl border border-border bg-muted shadow-2xl shadow-slate-900/10">
            <Player
              component={VideoComposition}
              durationInFrames={DEMO_VIDEO.durationInFrames}
              fps={DEMO_VIDEO.fps}
              compositionWidth={DEMO_VIDEO.width}
              compositionHeight={DEMO_VIDEO.height}
              style={{ width: "100%", aspectRatio: `${DEMO_VIDEO.width} / ${DEMO_VIDEO.height}` }}
              controls
              loop
              autoPlay={!reduceMotion}
              initiallyMuted
              clickToPlay
            />
          </div>
        </div>
      </div>
    </section>
  );
}
