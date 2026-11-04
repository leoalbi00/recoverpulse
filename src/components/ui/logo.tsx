"use client";

import { useId, type CSSProperties } from "react";

import {
  BRAND_CORE,
  BRAND_GRADIENT,
  BRAND_NODE,
  BRAND_ORBIT_PATH,
  BRAND_ORBIT_STROKE_WIDTH,
  BRAND_VIEWBOX,
} from "@/lib/brand";
import { cn } from "@/lib/utils";

export type LogoVariant = "full" | "icon" | "wordmark";
export type LogoSize = "sm" | "md" | "lg" | "xl";

/** Lato del marchio in px per ciascuna taglia; il wordmark scala in proporzione. */
const MARK_PX: Record<LogoSize, number> = { sm: 24, md: 30, lg: 40, xl: 56 };

type LogoProps = {
  /** "full" = marchio + wordmark (default), "icon" = solo marchio, "wordmark" = solo testo. */
  variant?: LogoVariant;
  /** Taglia predefinita o lato del marchio in px. */
  size?: LogoSize | number;
  /** Bagliore e pulsazione del nucleo AI; false per contesti statici (stampa, tabelle dense). */
  animated?: boolean;
  className?: string;
};

/**
 * Logo ufficiale OmniRev (concept "Orbit", vedi src/lib/brand.ts).
 * Vettoriale, eredita il tema: wordmark e nodo AI cambiano colore in base
 * alla classe `dark`. Micro-interazioni: il nucleo pulsa e il nodo emette un
 * alone a intervalli; al passaggio del mouse il nodo compie un giro
 * dell'orbita e il bagliore si intensifica. Tutto disattivato con
 * prefers-reduced-motion.
 */
export function Logo({ variant = "full", size = "md", animated = true, className }: LogoProps) {
  const markPx = typeof size === "number" ? size : MARK_PX[size];
  const wordmarkPx = Math.round(markPx * 0.66);

  return (
    <span
      className={cn("group/logo inline-flex shrink-0 items-center select-none", className)}
      style={{ gap: Math.round(markPx * 0.32) }}
    >
      {variant !== "wordmark" && <LogoMark size={markPx} animated={animated} />}
      {variant === "icon" ? (
        <span className="sr-only">OmniRev</span>
      ) : (
        <span
          className="font-sans leading-none font-semibold tracking-[-0.035em] text-zinc-950 dark:text-white"
          style={{ fontSize: wordmarkPx }}
        >
          Omni
          <span className="text-zinc-950/70 dark:text-white/70">Rev</span>
        </span>
      )}
    </span>
  );
}

// Origine delle trasformazioni nel centro dell'orbita, in unità del viewBox.
const ORBIT_ORIGIN: CSSProperties = { transformBox: "view-box", transformOrigin: "16px 16px" };
const SELF_ORIGIN: CSSProperties = { transformBox: "fill-box", transformOrigin: "center" };

function LogoMark({ size, animated }: { size: number; animated: boolean }) {
  const gradientId = `omnirev-gradient-${useId().replace(/:/g, "")}`;
  const paint = `url(#${gradientId})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={BRAND_VIEWBOX}
      fill="none"
      aria-hidden
      className={cn(
        "shrink-0 overflow-visible transition-[filter] duration-500",
        animated &&
          "drop-shadow-[0_0_6px_rgb(34_211_238/0.2)] group-hover/logo:drop-shadow-[0_0_10px_rgb(34_211_238/0.55)] dark:drop-shadow-[0_0_8px_rgb(34_211_238/0.35)]"
      )}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1={BRAND_GRADIENT.x1}
          y1={BRAND_GRADIENT.y1}
          x2={BRAND_GRADIENT.x2}
          y2={BRAND_GRADIENT.y2}
          gradientUnits="userSpaceOnUse"
        >
          {BRAND_GRADIENT.stops.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
      </defs>

      <path
        d={BRAND_ORBIT_PATH}
        stroke={paint}
        strokeWidth={BRAND_ORBIT_STROKE_WIDTH}
        strokeLinecap="round"
      />
      <circle
        cx={BRAND_CORE.cx}
        cy={BRAND_CORE.cy}
        r={BRAND_CORE.r}
        fill={paint}
        style={SELF_ORIGIN}
        className={cn(animated && "motion-safe:animate-[omnirev-core-pulse_3.2s_ease-in-out_infinite]")}
      />

      {/* Nodo AI + alone: ruotano insieme attorno al centro all'hover. */}
      <g
        style={ORBIT_ORIGIN}
        className={cn(
          animated &&
            "motion-safe:transition-transform motion-safe:duration-[900ms] motion-safe:ease-[cubic-bezier(0.65,0,0.35,1)] motion-safe:group-hover/logo:rotate-[360deg]"
        )}
      >
        {animated && (
          <circle
            cx={BRAND_NODE.cx}
            cy={BRAND_NODE.cy}
            r={BRAND_NODE.r}
            style={SELF_ORIGIN}
            className="fill-[#0891B2] opacity-0 motion-safe:animate-[omnirev-node-halo_3.2s_ease-out_infinite] dark:fill-[#A5F3FC]"
          />
        )}
        <circle
          cx={BRAND_NODE.cx}
          cy={BRAND_NODE.cy}
          r={BRAND_NODE.r}
          className="fill-[#0891B2] dark:fill-[#A5F3FC]"
        />
      </g>
    </svg>
  );
}

/**
 * Simbolo "Orbit" in tinta unica, senza animazioni: per superfici colorate
 * dal merchant (es. il fallback senza logo del portale /pay/[token]), dove il
 * gradiente del brand OmniRev stonerebbe col colore primario scelto.
 */
export function LogoGlyph({ size = 16, color = "currentColor", className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox={BRAND_VIEWBOX} fill="none" aria-hidden className={className}>
      <path d={BRAND_ORBIT_PATH} stroke={color} strokeWidth={BRAND_ORBIT_STROKE_WIDTH} strokeLinecap="round" />
      <circle cx={BRAND_CORE.cx} cy={BRAND_CORE.cy} r={BRAND_CORE.r} fill={color} />
      <circle cx={BRAND_NODE.cx} cy={BRAND_NODE.cy} r={BRAND_NODE.r} fill={color} />
    </svg>
  );
}
