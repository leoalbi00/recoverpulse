"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export function BentoGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6", className)}>{children}</div>;
}

type BentoCardProps = {
  /** Icona già renderizzata (es. `<RotateCw />`): un componente non può attraversare il confine server/client. */
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Etichetta opzionale accanto al titolo (es. "In arrivo"). */
  tag?: string;
  /** Piccola visualizzazione sotto al testo. */
  children?: React.ReactNode;
  className?: string;
};

/**
 * Card della Bento Grid: il bordo si illumina in un alone radiale che segue
 * il puntatore. L'alone è uno sfondo del wrapper esterno visibile solo nel
 * px di padding attorno alla card interna, quindi resta un filo luminoso sul
 * bordo e non copre mai il contenuto.
 */
export function BentoCard({ icon, title, description, tag, children, className }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      className={cn(
        "group relative rounded-2xl bg-zinc-50/10 p-px transition-colors",
        "hover:bg-[radial-gradient(320px_circle_at_var(--spot-x,50%)_var(--spot-y,50%),rgb(52_211_153/0.55),rgb(255_255_255/0.1)_70%)]",
        className
      )}
    >
      <div className="flex h-full flex-col gap-6 rounded-[calc(1rem-1px)] bg-zinc-950/95 p-6 backdrop-blur-md md:p-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-50/[0.03] [&_svg]:size-5 [&_svg]:text-emerald-400">
              {icon}
            </span>
            {tag && (
              <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                {tag}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-100">{title}</h3>
          <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
        </div>
        {children && <div className="mt-auto">{children}</div>}
      </div>
    </div>
  );
}
