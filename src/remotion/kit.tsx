// Componenti condivisi dai video OmniRev (spot TV, social, presentazione):
// dispositivi realistici, interfacce generiche di sistema, finitura
// "pellicola", marchio e audio. Solo stili inline e import relativi: la CLI
// Remotion non ha Tailwind né alias "@/". Nessuna grafica del sito: le
// interfacce mostrate sono quelle di telefono, email e pagamenti.
import { loadFont } from "@remotion/google-fonts/Inter";
import { useId, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, Audio, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import {
  BRAND_CORE,
  BRAND_GRADIENT,
  BRAND_NODE,
  BRAND_NODE_COLOR,
  BRAND_ORBIT_PATH,
  BRAND_ORBIT_STROKE_WIDTH,
  BRAND_VIEWBOX,
} from "../lib/brand";

const { fontFamily: INTER } = loadFont("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });
export const FONT = `${INTER}, -apple-system, system-ui, sans-serif`;

export function ease(frame: number, input: [number, number], output: [number, number]) {
  return interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
}

/** Secondi → frame alla frequenza della composizione corrente. */
export function useSeconds() {
  const { fps } = useVideoConfig();
  return (seconds: number) => Math.round(seconds * fps);
}

// ─── Audio ──────────────────────────────────────────────────────────────────

export type SfxName =
  | "ping"
  | "buzz"
  | "tap"
  | "whoosh"
  | "whoosh-down"
  | "typing"
  | "typing-soft"
  | "chime"
  | "tick"
  | "impact"
  | "ambience-night"
  | "ambience-morning";

/** Effetto sonoro (src/remotion/assets/audio/sfx-*.mp3) a partire dal frame `at`. */
export function Sfx({ name, at, volume = 1, duration }: { name: SfxName; at: number; volume?: number; duration?: number }) {
  return (
    <Sequence from={at} durationInFrames={duration} layout="none" name={`sfx ${name}`}>
      <Audio src={staticFile(`audio/sfx-${name}.mp3`)} volume={volume} />
    </Sequence>
  );
}

/** Base musicale (music-*.mp3) con dissolvenza finale opzionale. */
export function Music({ name, volume = 0.8, fadeOutFrames = 0 }: { name: string; volume?: number; fadeOutFrames?: number }) {
  const { durationInFrames } = useVideoConfig();
  return (
    <Audio
      src={staticFile(`audio/music-${name}.mp3`)}
      volume={(frame) =>
        fadeOutFrames > 0
          ? interpolate(frame, [durationInFrames - fadeOutFrames, durationInFrames], [volume, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : volume
      }
    />
  );
}

// ─── Ambiente: sfondo con bokeh, vignettatura, grana ────────────────────────

export type Mood = "night" | "morning" | "neutral" | "day" | "office";

const MOODS: Record<Mood, { base: string; light: string; bokeh: string[] }> = {
  night: {
    base: "radial-gradient(ellipse 90% 80% at 70% 40%, #141b2e 0%, #07090f 55%, #020203 100%)",
    light: "rgba(90,120,200,0.18)",
    bokeh: ["rgba(120,150,255,0.35)", "rgba(255,170,90,0.25)", "rgba(90,110,180,0.3)"],
  },
  morning: {
    base: "radial-gradient(ellipse 90% 80% at 70% 35%, #3a2c22 0%, #1a1410 50%, #070605 100%)",
    light: "rgba(255,190,120,0.22)",
    bokeh: ["rgba(255,210,150,0.4)", "rgba(255,240,220,0.3)", "rgba(255,170,100,0.3)"],
  },
  neutral: {
    base: "radial-gradient(ellipse 90% 80% at 70% 40%, #1f2226 0%, #0c0d0f 55%, #030303 100%)",
    light: "rgba(220,225,235,0.12)",
    bokeh: ["rgba(255,255,255,0.22)", "rgba(200,215,240,0.25)", "rgba(255,225,190,0.2)"],
  },
  day: {
    base: "radial-gradient(ellipse 90% 80% at 65% 35%, #6d7a86 0%, #3b434b 50%, #15181b 100%)",
    light: "rgba(255,250,235,0.25)",
    bokeh: ["rgba(255,255,255,0.45)", "rgba(190,220,255,0.4)", "rgba(255,236,200,0.35)"],
  },
  office: {
    base: "radial-gradient(ellipse 90% 80% at 60% 40%, #2b3138 0%, #14171b 55%, #060708 100%)",
    light: "rgba(200,225,255,0.16)",
    bokeh: ["rgba(180,210,255,0.3)", "rgba(255,255,255,0.25)", "rgba(255,215,170,0.22)"],
  },
};

export function Environment({ mood, seed, count = 14 }: { mood: Mood; seed: string; count?: number }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const palette = MOODS[mood];

  return (
    <AbsoluteFill style={{ background: palette.base }}>
      {Array.from({ length: count }, (_, index) => {
        const size = (60 + random(`${seed}-s-${index}`) * 220) * (Math.max(width, height) / 1920);
        const x = random(`${seed}-x-${index}`) * width;
        const y = random(`${seed}-y-${index}`) * height;
        const drift = Math.sin(frame / 40 + index) * 8;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: x - size / 2 + drift,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: palette.bokeh[index % palette.bokeh.length],
              filter: `blur(${18 + random(`${seed}-b-${index}`) * 30}px)`,
              opacity: 0.35 + random(`${seed}-o-${index}`) * 0.5,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 40% 50% at 68% 45%, ${palette.light}, transparent 70%)` }} />
    </AbsoluteFill>
  );
}

/** Vignettatura e grana animata, sopra a tutto. */
export function FilmFinish({ grain = 0.07, vignette = 0.65 }: { grain?: number; vignette?: number }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const id = useId().replace(/:/g, "");
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,${vignette}) 100%)` }} />
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: grain, mixBlendMode: "overlay" }}>
        <filter id={`grain-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={frame % 12} stitchTiles="stitch" />
        </filter>
        <rect width={width} height={height} filter={`url(#grain-${id})`} />
      </svg>
    </AbsoluteFill>
  );
}

/** Stacco tra scene: dissolvenza breve in entrata e (salvo `hold`) in uscita. */
export function Cut({ duration, hold = false, fade = 6, children }: { duration: number; hold?: boolean; fade?: number; children: ReactNode }) {
  const frame = useCurrentFrame();
  const opacity = hold
    ? interpolate(frame, [0, fade], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : interpolate(frame, [0, fade, duration - fade, duration], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

// ─── Telefono ───────────────────────────────────────────────────────────────

/** Dimensioni logiche dello schermo (iPhone 15/16) e cornice del dispositivo. */
export const SCREEN = { width: 393, height: 852, radius: 55 };
const BEZEL = 13;

/**
 * Smartphone in prospettiva con lenta carrellata della "camera": `tilt` e
 * `push` vanno da inizio a fine scena. `size` scala l'intero dispositivo.
 */
export function Phone({
  children,
  duration,
  x = 1240,
  y = 540,
  size = 1,
  tilt = [-14, -6],
  push = [1, 1.07],
  enter = 1,
  shake = 0,
}: {
  children: ReactNode;
  duration: number;
  x?: number;
  y?: number;
  size?: number;
  tilt?: [number, number];
  push?: [number, number];
  enter?: number;
  shake?: number;
}) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, duration], [0, 1], { extrapolateRight: "clamp" });
  const rotateY = tilt[0] + (tilt[1] - tilt[0]) * t;
  const scale = (push[0] + (push[1] - push[0]) * t) * size;
  const width = SCREEN.width + BEZEL * 2;
  const height = SCREEN.height + BEZEL * 2;

  return (
    <div style={{ position: "absolute", left: x - width / 2, top: y - height / 2, width, height, perspective: 2600 }}>
      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          bottom: -60,
          height: 80,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.7)",
          filter: "blur(40px)",
          opacity: enter,
          transform: `scale(${scale})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: SCREEN.radius + BEZEL,
          background: "linear-gradient(145deg, #4a4a4f 0%, #1c1c1f 35%, #0e0e10 65%, #3a3a3f 100%)",
          padding: BEZEL,
          boxSizing: "border-box",
          boxShadow:
            "0 60px 120px rgba(0,0,0,0.65), 0 20px 40px rgba(0,0,0,0.5), inset 0 0 0 1.5px rgba(255,255,255,0.12), inset 0 0 0 4px #050506",
          transform: `translateY(${(1 - enter) * 120}px) rotateY(${rotateY}deg) rotateX(3deg) scale(${scale}) translateX(${shake}px)`,
          opacity: enter,
        }}
      >
        <PhoneScreen glare={115 + rotateY * 2}>{children}</PhoneScreen>
      </div>
    </div>
  );
}

/** Schermo del telefono (senza cornice): usato anche a tutto schermo nei formati verticali. */
export function PhoneScreen({ children, glare = 115, radius = SCREEN.radius }: { children: ReactNode; glare?: number; radius?: number }) {
  return (
    <div
      style={{
        position: "relative",
        width: SCREEN.width,
        height: SCREEN.height,
        borderRadius: radius,
        overflow: "hidden",
        background: "#000",
        fontFamily: FONT,
      }}
    >
      {children}
      <div style={{ position: "absolute", top: 11, left: SCREEN.width / 2 - 62, width: 124, height: 36, borderRadius: 20, background: "#000" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${glare}deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.05) 100%)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export function StatusBar({ time, dark = false }: { time: string; dark?: boolean }) {
  const color = dark ? "#000" : "#fff";
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 34px 0 46px",
        color,
        fontSize: 16,
        fontWeight: 600,
        zIndex: 5,
      }}
    >
      <span>{time}</span>
      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <svg width={18} height={12} viewBox="0 0 18 12" fill={color}>
          <rect x={0} y={8} width={3} height={4} rx={1} />
          <rect x={5} y={5.5} width={3} height={6.5} rx={1} />
          <rect x={10} y={3} width={3} height={9} rx={1} />
          <rect x={15} y={0} width={3} height={12} rx={1} />
        </svg>
        <svg width={16} height={12} viewBox="0 0 16 12" fill={color}>
          <path d="M8 2.2c2.4 0 4.6.9 6.2 2.5l1.2-1.2C13.4 1.4 10.8.4 8 .4S2.6 1.4.6 3.5l1.2 1.2C3.4 3.1 5.6 2.2 8 2.2Zm0 3.5c1.4 0 2.8.6 3.8 1.5L13 6C11.7 4.7 9.9 3.9 8 3.9S4.3 4.7 3 6l1.2 1.2c1-.9 2.4-1.5 3.8-1.5Zm0 3.4c.6 0 1.1.2 1.5.6L8 11.2 6.5 9.7c.4-.4.9-.6 1.5-.6Z" />
        </svg>
        <span
          style={{
            width: 25,
            height: 12,
            borderRadius: 4,
            border: `1px solid ${dark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.45)"}`,
            padding: 1.5,
            boxSizing: "border-box",
            display: "inline-block",
          }}
        >
          <span style={{ display: "block", width: "72%", height: "100%", borderRadius: 2, background: color }} />
        </span>
      </span>
    </div>
  );
}

/** Tocco del dito: cerchio che si comprime e si dissolve a partire da `at`. */
export function Tap({ x, y, at }: { x: number; y: number; at: number }) {
  const frame = useCurrentFrame();
  if (frame < at - 6 || frame > at + 16) return null;
  const approach = ease(frame, [at - 6, at], [0, 1]);
  const release = ease(frame, [at, at + 16], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 28,
        top: y - 28,
        width: 56,
        height: 56,
        borderRadius: "50%",
        // Visibile sia su schermi chiari sia scuri.
        background: "rgba(110,110,120,0.35)",
        boxShadow: "0 0 0 1.5px rgba(255,255,255,0.8), 0 2px 10px rgba(0,0,0,0.25)",
        transform: `scale(${1.3 - approach * 0.4 + release * 0.5})`,
        opacity: approach * (1 - release),
        zIndex: 20,
      }}
    />
  );
}

/** Icona generica dell'app dei pagamenti (non riproduce app reali). */
export function PaymentsIcon({ size = 38 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #6b6b73, #3a3a40)",
      }}
    >
      <svg width={size * 0.58} height={size * 0.42} viewBox="0 0 22 16" fill="none" stroke="#fff" strokeWidth={1.8}>
        <rect x={1} y={1} width={20} height={14} rx={2.5} />
        <path d="M1 5.5h20" />
        <path d="M5 11h4" />
      </svg>
    </div>
  );
}

export function Notification({
  app = "Pagamenti",
  icon,
  when,
  title,
  body,
  enter,
  dim = false,
  light = false,
}: {
  app?: string;
  /** Icona dell'app; di default quella generica dei pagamenti. */
  icon?: ReactNode;
  when: string;
  title: string;
  body: string;
  enter: number;
  dim?: boolean;
  /** Vetro chiaro (sfondi luminosi). */
  light?: boolean;
}) {
  return (
    <div
      style={{
        margin: "0 12px",
        padding: "13px 15px",
        borderRadius: 22,
        background: dim ? "rgba(60,60,67,0.35)" : light ? "rgba(255,255,255,0.55)" : "rgba(245,245,250,0.22)",
        backdropFilter: "blur(30px) saturate(160%)",
        WebkitBackdropFilter: "blur(30px) saturate(160%)",
        display: "flex",
        gap: 11,
        color: light ? "#111" : "#fff",
        opacity: enter * (dim ? 0.75 : 1),
        transform: `translateY(${(1 - enter) * -40}px) scale(${0.94 + enter * 0.06})`,
      }}
    >
      {icon ?? <PaymentsIcon />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span style={{ fontWeight: 600 }}>{title}</span>
          <span style={{ opacity: 0.6 }}>{when}</span>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.32, marginTop: 2, opacity: 0.92 }}>{body}</div>
        <div style={{ fontSize: 12, marginTop: 3, opacity: 0.5 }}>{app}</div>
      </div>
    </div>
  );
}

export function LockScreen({
  time,
  date,
  wallpaper,
  children,
  top = 290,
}: {
  time: string;
  date: string;
  wallpaper: string;
  children?: ReactNode;
  top?: number;
}) {
  return (
    <AbsoluteFill style={{ background: wallpaper }}>
      <StatusBar time="" />
      <div style={{ position: "absolute", top: 74, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.92)" }}>
        <div style={{ fontSize: 19, fontWeight: 600 }}>{date}</div>
        <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: -2, lineHeight: 1.05, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{time}</div>
      </div>
      <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: SCREEN.width / 2 - 68,
          width: 136,
          height: 5,
          borderRadius: 3,
          background: "rgba(255,255,255,0.85)",
        }}
      />
    </AbsoluteFill>
  );
}

export const WALLPAPERS = {
  night:
    "radial-gradient(ellipse 120% 60% at 30% 20%, #1d2a52 0%, transparent 60%), radial-gradient(ellipse 100% 70% at 80% 90%, #2a1640 0%, transparent 65%), #05060c",
  morning:
    "radial-gradient(ellipse 120% 70% at 70% 15%, #ffb36b 0%, transparent 55%), radial-gradient(ellipse 120% 80% at 20% 90%, #6b3a5c 0%, transparent 60%), linear-gradient(180deg, #e98a5a 0%, #7a3f55 55%, #2b1a2e 100%)",
  dusk: "radial-gradient(ellipse 120% 70% at 30% 10%, #4a5d9e 0%, transparent 60%), radial-gradient(ellipse 110% 80% at 80% 95%, #b4566b 0%, transparent 60%), linear-gradient(180deg, #2b3566 0%, #3b2448 60%, #120b18 100%)",
  sea: "radial-gradient(ellipse 120% 70% at 70% 20%, #7fd3e6 0%, transparent 60%), linear-gradient(180deg, #2f8fb0 0%, #155a7a 55%, #072c40 100%)",
};

/** Icona generica della posta. */
export function MailIcon({ size = 38 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #5ac8fa, #1a73e8)",
      }}
    >
      <svg width={size * 0.58} height={size * 0.42} viewBox="0 0 22 16" fill="none" stroke="#fff" strokeWidth={1.8}>
        <rect x={1} y={1} width={20} height={14} rx={2.5} />
        <path d="m2 2 9 7 9-7" />
      </svg>
    </div>
  );
}

// ─── Merchant di finzione ───────────────────────────────────────────────────

/** Marchio di un merchant di finzione (cliente di OmniRev): è lui a parlare col cliente finale. */
export function MerchantBadge({ size, letter, colors }: { size: number; letter: string; colors: [string, string] }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.55,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}

// ─── Laptop ─────────────────────────────────────────────────────────────────

/** Schermo logico del portatile, in px. */
export const LAPTOP_SCREEN = { width: 1280, height: 800 };

/**
 * Portatile in alluminio con lieve prospettiva: coperchio con cornice nera,
 * schermo `LAPTOP_SCREEN` scalato di `size`, base con incavo.
 */
export function Laptop({
  children,
  duration,
  x = 960,
  y = 560,
  size = 0.8,
  tilt = [6, 2],
  push = [1, 1.05],
  enter = 1,
}: {
  children: ReactNode;
  duration: number;
  x?: number;
  y?: number;
  size?: number;
  tilt?: [number, number];
  push?: [number, number];
  enter?: number;
}) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, duration], [0, 1], { extrapolateRight: "clamp" });
  const rotateY = tilt[0] + (tilt[1] - tilt[0]) * t;
  const scale = (push[0] + (push[1] - push[0]) * t) * size;
  const bezel = 18;
  const lidW = LAPTOP_SCREEN.width + bezel * 2;
  const lidH = LAPTOP_SCREEN.height + bezel * 2 + 10;

  return (
    <div style={{ position: "absolute", left: x - lidW / 2, top: y - lidH / 2 - 20, width: lidW, height: lidH, perspective: 3200 }}>
      <div
        style={{
          transform: `translateY(${(1 - enter) * 80}px) rotateY(${rotateY}deg) rotateX(4deg) scale(${scale})`,
          transformOrigin: "50% 60%",
          opacity: enter,
        }}
      >
        <div
          style={{
            width: lidW,
            height: lidH,
            borderRadius: "28px 28px 10px 10px",
            background: "#0a0a0b",
            boxShadow: "0 0 0 2px #2c2c30, 0 50px 120px rgba(0,0,0,0.6)",
            padding: `${bezel}px ${bezel}px ${bezel + 10}px`,
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", top: 6, left: lidW / 2 - 4, width: 8, height: 8, borderRadius: "50%", background: "#1d1d22" }} />
          <div
            style={{
              position: "relative",
              width: LAPTOP_SCREEN.width,
              height: LAPTOP_SCREEN.height,
              overflow: "hidden",
              borderRadius: 6,
              background: "#fff",
              fontFamily: FONT,
            }}
          >
            {children}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(${120 + rotateY * 3}deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 35%)`,
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
        {/* Base */}
        <div
          style={{
            width: lidW + 200,
            marginLeft: -100,
            height: 26,
            borderRadius: "0 0 26px 26px",
            background: "linear-gradient(180deg, #d9dade 0%, #a9abb0 45%, #6e7075 100%)",
            boxShadow: "0 30px 50px rgba(0,0,0,0.55)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              width: 220,
              height: 10,
              marginLeft: -110,
              borderRadius: "0 0 10px 10px",
              background: "linear-gradient(180deg, #8d8f94, #b8babe)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Carta di pagamento ─────────────────────────────────────────────────────

/** Carta di pagamento fisica, con chip, numeri in rilievo e riflesso che segue l'inclinazione. */
export function PaymentCard({
  holder,
  last4,
  expiry,
  tone = ["#1d2b4f", "#0b1226"],
  width = 520,
  rotateX = 8,
  rotateY = -14,
  dim = 0,
}: {
  holder: string;
  last4: string;
  expiry: string;
  tone?: [string, string];
  width?: number;
  rotateX?: number;
  rotateY?: number;
  /** Desaturazione (0–1), es. carta scaduta. */
  dim?: number;
}) {
  const height = width / 1.586;
  const unit = width / 520;
  const shine = 50 + rotateY * 3;
  const embossed: CSSProperties = {
    color: "#e9ecf2",
    textShadow: "0 1px 0 rgba(255,255,255,0.35), 0 -1px 0 rgba(0,0,0,0.55), 0 2px 3px rgba(0,0,0,0.35)",
    fontVariantNumeric: "tabular-nums",
  };
  return (
    <div style={{ perspective: 1800 }}>
      <div
        style={{
          width,
          height,
          borderRadius: 22 * unit,
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${tone[0]} 0%, ${tone[1]} 100%)`,
          boxShadow: `0 ${40 * unit}px ${80 * unit}px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.12)`,
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          filter: `saturate(${1 - dim * 0.9}) brightness(${1 - dim * 0.25})`,
          fontFamily: FONT,
        }}
      >
        {/* Trama e riflesso */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(115deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 2px, transparent 2px, transparent 6px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(110deg, transparent ${shine - 25}%, rgba(255,255,255,0.18) ${shine}%, transparent ${shine + 25}%)`,
          }}
        />
        {/* Chip */}
        <div
          style={{
            position: "absolute",
            left: 48 * unit,
            top: 96 * unit,
            width: 66 * unit,
            height: 50 * unit,
            borderRadius: 9 * unit,
            background: "linear-gradient(135deg, #f3d892 0%, #c9a24a 45%, #f1d27e 70%, #a9822e 100%)",
            boxShadow: "inset 0 0 0 1px rgba(120,90,20,0.5)",
          }}
        >
          <div style={{ position: "absolute", left: "33%", top: 0, bottom: 0, width: 1, background: "rgba(110,80,20,0.55)" }} />
          <div style={{ position: "absolute", left: "66%", top: 0, bottom: 0, width: 1, background: "rgba(110,80,20,0.55)" }} />
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(110,80,20,0.55)" }} />
        </div>
        {/* Contactless */}
        <svg
          style={{ position: "absolute", left: 132 * unit, top: 104 * unit }}
          width={30 * unit}
          height={34 * unit}
          viewBox="0 0 24 28"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth={2.2}
          strokeLinecap="round"
        >
          <path d="M5 8c2.5 3.5 2.5 8.5 0 12" />
          <path d="M10 5c4 5 4 13 0 18" />
          <path d="M15 2c5.5 7 5.5 17 0 24" />
        </svg>
        <div style={{ position: "absolute", left: 48 * unit, top: 186 * unit, fontSize: 36 * unit, letterSpacing: 3 * unit, fontWeight: 500, ...embossed }}>
          •••• •••• •••• {last4}
        </div>
        <div style={{ position: "absolute", left: 48 * unit, bottom: 34 * unit, fontSize: 19 * unit, letterSpacing: 2 * unit, textTransform: "uppercase", ...embossed }}>
          {holder}
        </div>
        <div style={{ position: "absolute", left: 340 * unit, bottom: 34 * unit, fontSize: 19 * unit, letterSpacing: 2 * unit, ...embossed }}>
          <span style={{ fontSize: 10 * unit, letterSpacing: 1, opacity: 0.7, marginRight: 8 * unit }}>SCAD.</span>
          {expiry}
        </div>
        {/* Circuito generico (due cerchi), non un marchio reale */}
        <div style={{ position: "absolute", right: 40 * unit, top: 36 * unit, display: "flex" }}>
          <div style={{ width: 44 * unit, height: 44 * unit, borderRadius: "50%", background: "rgba(255,255,255,0.75)" }} />
          <div style={{ width: 44 * unit, height: 44 * unit, borderRadius: "50%", background: "rgba(255,255,255,0.35)", marginLeft: -16 * unit }} />
        </div>
      </div>
    </div>
  );
}

// ─── Marchio OmniRev ────────────────────────────────────────────────────────

/** Marchio "Orbit" vettoriale dalla geometria condivisa di src/lib/brand.ts, con animazioni guidate dal frame. */
export function BrandMark({ size, draw = 1, node = 1, nodeColor = BRAND_NODE_COLOR.dark }: { size: number; draw?: number; node?: number; nodeColor?: string }) {
  const gradientId = `omnirev-gradient-${useId().replace(/:/g, "")}`;
  const paint = `url(#${gradientId})`;
  const { cx, cy } = BRAND_NODE;
  return (
    <svg width={size} height={size} viewBox={BRAND_VIEWBOX} fill="none" style={{ overflow: "visible" }}>
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
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
        opacity={draw > 0 ? 1 : 0}
      />
      <circle cx={BRAND_CORE.cx} cy={BRAND_CORE.cy} r={BRAND_CORE.r} fill={paint} opacity={draw} />
      <circle cx={cx} cy={cy} r={BRAND_NODE.r} fill={nodeColor} transform={`translate(${cx} ${cy}) scale(${node}) translate(${-cx} ${-cy})`} />
    </svg>
  );
}

/** Marchio + wordmark "OmniRev". */
export function Wordmark({
  size,
  draw = 1,
  node = 1,
  textIn = 1,
  color = "#fff",
  nodeColor,
}: {
  size: number;
  draw?: number;
  node?: number;
  textIn?: number;
  color?: string;
  nodeColor?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.3 }}>
      <BrandMark size={size} draw={draw} node={node} nodeColor={nodeColor} />
      <span
        style={{
          fontFamily: FONT,
          fontSize: size * 0.82,
          lineHeight: 1,
          fontWeight: 600,
          letterSpacing: "-0.035em",
          color,
          opacity: textIn,
          transform: `translateX(${(1 - textIn) * -size * 0.18}px)`,
        }}
      >
        Omni<span style={{ opacity: 0.7 }}>Rev</span>
      </span>
    </div>
  );
}
