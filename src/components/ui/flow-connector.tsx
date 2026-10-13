"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type FlowLink = {
  /** Punto di partenza lungo il lato d'ingresso, in frazione (0-1). */
  from: number;
  /** Punto d'arrivo lungo il lato d'uscita, in frazione (0-1). */
  to: number;
};

type FlowConnectorProps = {
  links: FlowLink[];
  /** horizontal: da sinistra a destra; vertical: dall'alto in basso. */
  direction?: "horizontal" | "vertical";
  className?: string;
};

/**
 * Connettore statico tra due blocchi adiacenti: curve di Bézier sottili con
 * un punto d'arrivo, senza animazioni. Occupa la cella di layout in cui è
 * inserito (nessun posizionamento assoluto sulla pagina): misura le proprie
 * dimensioni con un ResizeObserver e disegna i tracciati in pixel, così le
 * curve non si deformano a nessuna larghezza.
 */
export function FlowConnector({ links, direction = "horizontal", className }: FlowConnectorProps) {
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

  function buildPath({ from, to }: FlowLink) {
    if (direction === "horizontal") {
      const y1 = from * h;
      const y2 = to * h;
      return `M 0 ${y1} C ${w / 2} ${y1}, ${w / 2} ${y2}, ${w} ${y2}`;
    }
    const x1 = from * w;
    const x2 = to * w;
    return `M ${x1} 0 C ${x1} ${h / 2}, ${x2} ${h / 2}, ${x2} ${h}`;
  }

  function endPoint({ to }: FlowLink) {
    return direction === "horizontal" ? { cx: w, cy: to * h } : { cx: to * w, cy: h };
  }

  return (
    <div ref={ref} aria-hidden className={cn("relative h-full w-full", className)}>
      {w > 0 && h > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="block overflow-visible">
          {links.map((link, index) => (
            <path key={index} d={buildPath(link)} className="stroke-stone-300" strokeWidth={1.5} strokeLinecap="round" />
          ))}
          <circle {...endPoint(links[0])} r={3} className="fill-emerald-700" />
        </svg>
      )}
    </div>
  );
}
