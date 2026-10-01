// Video-demo OmniRev in codice React (Remotion): addebito fallito → diagnosi
// AI → Magic Link → recupero, con grafico del fatturato recuperato. Solo
// stili inline e import relativi: lo stesso file è usato sia dal player
// della landing (bundler Next) sia dalla CLI Remotion (bundler proprio, senza
// Tailwind né alias "@/").
import type { CSSProperties } from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const DEMO_VIDEO = {
  id: "OmniRevDemo",
  fps: 30,
  durationInFrames: 360,
  width: 1280,
  height: 720,
} as const;

const COLORS = {
  background: "#09090b",
  card: "#18181b",
  border: "#27272a",
  text: "#f4f4f5",
  muted: "#a1a1aa",
  rose: "#f43f5e",
  emerald: "#10b981",
  emeraldLight: "#6ee7b7",
  amber: "#fbbf24",
};

const FONT = "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

// Fatturato recuperato cumulativo per settimana (in $), usato dal grafico finale.
const RECOVERED_SERIES = [0, 1240, 2680, 3910, 5480, 7020, 8350, 9940, 11260, 12480];

function clamp01Interpolate(frame: number, input: [number, number], output: [number, number]) {
  return interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

const cardStyle: CSSProperties = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 24,
  boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
};

function SceneTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  const frame = useCurrentFrame();
  const opacity = clamp01Interpolate(frame, [0, 15], [0, 1]);
  const y = clamp01Interpolate(frame, [0, 15], [16, 0]);

  return (
    <div style={{ position: "absolute", top: 64, left: 0, right: 0, textAlign: "center", opacity, transform: `translateY(${y}px)` }}>
      <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: COLORS.muted, textTransform: "uppercase" }}>
        {eyebrow}
      </div>
      <div style={{ marginTop: 12, fontSize: 44, fontWeight: 600, color: COLORS.text, letterSpacing: -1 }}>{title}</div>
    </div>
  );
}

function FailedChargeScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18 } });
  const failedAt = 40;
  const failed = frame >= failedAt;
  const shake = failed ? Math.sin((frame - failedAt) * 1.6) * interpolate(frame, [failedAt, failedAt + 20], [14, 0], { extrapolateRight: "clamp" }) : 0;
  const accent = failed ? COLORS.rose : COLORS.muted;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <SceneTitle eyebrow="01 · Addebito" title="Il rinnovo mensile viene rifiutato" />
      <div
        style={{
          ...cardStyle,
          width: 560,
          padding: 40,
          marginTop: 90,
          transform: `scale(${0.9 + enter * 0.1}) translateX(${shake}px)`,
          opacity: enter,
          borderColor: failed ? "rgba(244,63,94,0.5)" : COLORS.border,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: 18, color: COLORS.muted }}>in_1Q8x2LZv · Growth</span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: 999,
              color: accent,
              background: failed ? "rgba(244,63,94,0.12)" : "rgba(161,161,170,0.12)",
            }}
          >
            {failed ? "✕ Rifiutato" : "In elaborazione…"}
          </span>
        </div>
        <div style={{ marginTop: 28, fontSize: 88, fontWeight: 600, color: failed ? COLORS.rose : COLORS.text, letterSpacing: -2 }}>
          $299.00
        </div>
        <div style={{ marginTop: 12, fontSize: 20, color: COLORS.muted }}>Visa •••• 4242 · scad. 09/26</div>
      </div>
    </AbsoluteFill>
  );
}

const ENGINE_STEPS = [
  { label: "Decline code", value: "expired_card", color: COLORS.rose },
  { label: "Categoria", value: "Carta scaduta", color: COLORS.amber },
  { label: "Strategia", value: "Magic Link immediato", color: COLORS.emeraldLight },
  { label: "Canale", value: "Email · brand del merchant", color: COLORS.emeraldLight },
];

function EngineScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <SceneTitle eyebrow="02 · Motore AI" title="OmniRev diagnostica e decide in millisecondi" />
      <div style={{ ...cardStyle, width: 720, padding: 36, marginTop: 110, display: "flex", flexDirection: "column", gap: 16 }}>
        {ENGINE_STEPS.map((step, index) => {
          const appear = spring({ frame: frame - 10 - index * 14, fps, config: { damping: 16 } });
          return (
            <div
              key={step.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 24px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${COLORS.border}`,
                opacity: appear,
                transform: `translateX(${(1 - appear) * -40}px)`,
              }}
            >
              <span style={{ fontSize: 20, color: COLORS.muted }}>{step.label}</span>
              <span style={{ fontFamily: index === 0 ? MONO : FONT, fontSize: 24, fontWeight: 600, color: step.color }}>
                {step.value}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function RecoveryChartScene() {
  const frame = useCurrentFrame();
  const progress = clamp01Interpolate(frame, [10, 90], [0, 1]);

  const width = 900;
  const height = 300;
  const max = RECOVERED_SERIES[RECOVERED_SERIES.length - 1];
  const points = RECOVERED_SERIES.map((value, index) => ({
    x: (index / (RECOVERED_SERIES.length - 1)) * width,
    y: height - (value / max) * height,
  }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  const pathLength = 1600;
  const total = Math.round(max * progress);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <SceneTitle eyebrow="03 · Recupero" title="Il fatturato perso torna in cassa" />
      <div style={{ ...cardStyle, width: 1000, padding: 40, marginTop: 120 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 20, color: COLORS.muted }}>Recuperato · ultime 10 settimane</span>
          <span style={{ fontSize: 56, fontWeight: 600, color: COLORS.emerald, fontVariantNumeric: "tabular-nums" }}>
            {formatUsd(total)}
          </span>
        </div>
        <svg width={width} height={height + 10} style={{ marginTop: 24, overflow: "visible" }}>
          <defs>
            <linearGradient id="omnirev-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0} />
            </linearGradient>
            <clipPath id="omnirev-reveal">
              <rect x={0} y={-10} width={width * progress} height={height + 20} />
            </clipPath>
          </defs>
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line key={ratio} x1={0} x2={width} y1={height * ratio} y2={height * ratio} stroke={COLORS.border} strokeDasharray="4 8" />
          ))}
          <path d={area} fill="url(#omnirev-area)" clipPath="url(#omnirev-reveal)" />
          <path
            d={path}
            fill="none"
            stroke={COLORS.emerald}
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={pathLength}
            strokeDashoffset={pathLength * (1 - progress)}
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
}

function SuccessScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 11, stiffness: 140 } });
  const ring = interpolate(frame, [0, 40], [0, 1], { extrapolateRight: "clamp" });
  const textIn = clamp01Interpolate(frame, [18, 40], [0, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `3px solid ${COLORS.emerald}`,
            transform: `scale(${1 + ring * 0.6})`,
            opacity: 1 - ring,
          }}
        />
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: COLORS.emerald,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${pop})`,
            boxShadow: "0 0 80px rgba(16,185,129,0.6)",
          }}
        >
          <svg width={80} height={80} viewBox="0 0 24 24" fill="none" stroke={COLORS.background} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
      </div>
      <div style={{ marginTop: 48, textAlign: "center", opacity: textIn, transform: `translateY(${(1 - textIn) * 20}px)` }}>
        <div style={{ fontSize: 56, fontWeight: 600, color: COLORS.text, letterSpacing: -1 }}>Pagamento recuperato</div>
        <div style={{ marginTop: 14, fontSize: 24, color: COLORS.muted }}>
          $299.00 · carta aggiornata in 1 click ·{" "}
          <span style={{ color: COLORS.emeraldLight, fontWeight: 600 }}>OmniRev</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

const SCENES = [
  { from: 0, duration: 90, Component: FailedChargeScene },
  { from: 90, duration: 90, Component: EngineScene },
  { from: 180, duration: 105, Component: RecoveryChartScene },
  { from: 285, duration: 75, Component: SuccessScene },
];

export function VideoComposition() {
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [0, 90, 180, 360], [0.15, 0.1, 0.2, 0.35]);
  const glowColor = frame < 90 ? "244,63,94" : "16,185,129";

  return (
    <AbsoluteFill style={{ background: COLORS.background, fontFamily: FONT }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 60%, rgba(${glowColor},${glow}), transparent 70%)`,
        }}
      />
      {SCENES.map(({ from, duration, Component }) => (
        <Sequence key={from} from={from} durationInFrames={duration}>
          <SceneFade duration={duration}>
            <Component />
          </SceneFade>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

function SceneFade({ duration, children }: { duration: number; children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, duration - 10, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}
