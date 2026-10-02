"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type BeamLink = {
  /** Punto di partenza lungo il lato d'ingresso, in frazione (0-1). */
  from: number;
  /** Punto d'arrivo lungo il lato d'uscita, in frazione (0-1). */
  to: number;
};

type AnimatedBeamProps = {
  links: BeamLink[];
  /** horizontal: da sinistra a destra; vertical: dall'alto in basso. */
  direction?: "horizontal" | "vertical";
  /** Durata di un passaggio del raggio, in secondi. */
  duration?: number;
  className?: string;
};

/**
 * Connettore con "raggi" luminosi che scorrono lungo curve di Bézier tra due
 * blocchi adiacenti. Occupa la cella di layout in cui è inserito (nessun
 * posizionamento assoluto sulla pagina): misura le proprie dimensioni con un
 * ResizeObserver e disegna i tracciati in pixel, così le curve non si
 * deformano a nessuna larghezza. Con prefers-reduced-motion restano solo le
 * linee statiche.
 */
export function AnimatedBeam({ links, direction = "horizontal", duration = 3, className }: AnimatedBeamProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { width: w, height: h } = size;

  function buildPath({ from, to }: BeamLink) {
    if (direction === "horizontal") {
      const y1 = from * h;
      const y2 = to * h;
      return `M 0 ${y1} C ${w / 2} ${y1}, ${w / 2} ${y2}, ${w} ${y2}`;
    }
    const x1 = from * w;
    const x2 = to * w;
    return `M ${x1} 0 C ${x1} ${h / 2}, ${x2} ${h / 2}, ${x2} ${h}`;
  }

  return (
    <div ref={ref} aria-hidden className={cn("relative h-full w-full", className)}>
      {w > 0 && h > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="block overflow-visible">
          {links.map((link, index) => {
            const d = buildPath(link);
            return (
              <g key={index}>
                <path d={d} stroke="rgb(255 255 255 / 0.1)" strokeWidth={1.5} strokeLinecap="round" />
                <path
                  d={d}
                  pathLength={100}
                  stroke="#34d399"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray="20 200"
                  className="omnirev-beam motion-reduce:hidden"
                  style={{
                    animationDuration: `${duration}s`,
                    animationDelay: `${(index * duration) / Math.max(links.length, 1) / 2}s`,
                    filter: "drop-shadow(0 0 4px rgb(52 211 153 / 0.7))",
                  }}
                />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
