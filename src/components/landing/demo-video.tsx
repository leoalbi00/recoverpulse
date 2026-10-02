"use client";

import { Player } from "@remotion/player";
import { useReducedMotion } from "framer-motion";
import { PlayCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DEMO_VIDEO, VideoComposition } from "@/remotion/video-composition";

/**
 * Video-demo generata in codice (src/remotion/video-composition.tsx) e
 * riprodotta dal vivo con @remotion/player dentro un dialog aperto dalla
 * Hero: nessun MP4 da ospitare, e la pagina non porta un player pesante in
 * vista finché nessuno lo chiede. Lo stesso componente si esporta in MP4 con
 * `npm run video:render`.
 */
export function DemoVideoDialog({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <Dialog>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-12 gap-2 rounded-full border-white/10 bg-zinc-50/[0.03] px-7 text-base font-medium text-zinc-200 backdrop-blur-md hover:bg-zinc-50/[0.08]",
          className
        )}
      >
        <PlayCircle className="size-4 text-emerald-400" />
        Guarda la demo
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-1 pr-10">
          <DialogTitle className="text-base font-semibold text-zinc-100">Il motore di recupero, in azione</DialogTitle>
          <DialogDescription className="text-sm text-zinc-400">
            Dal codice di rifiuto della banca al pagamento recuperato, in 12 secondi.
          </DialogDescription>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black">
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
      </DialogContent>
    </Dialog>
  );
}
