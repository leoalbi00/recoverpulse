// Video LinkedIn (20 s, 1080×1080, 30 fps): tono editoriale e chiaro, per
// decisori aziendali. "3 motivi per cui perdi clienti senza che abbiano
// disdetto": ogni motivo mostra una carta reale, il codice di rifiuto del
// gateway e la strategia che OmniRev applica davvero
// (src/lib/dunning-error-categorization.ts). Base lo-fi a 85 bpm.
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { BRAND_NODE_COLOR } from "../lib/brand";
import { Cut, ease, FilmFinish, FONT, Music, PaymentCard, Sfx, Wordmark } from "./kit";

const { fontFamily: SERIF } = loadSerif("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["500"], subsets: ["latin"] });

export const OMNIREV_LINKEDIN = {
  id: "OmniRevLinkedIn",
  fps: 30,
  durationInFrames: 600,
  width: 1080,
  height: 1080,
} as const;

const PAPER = "#f3efe6";
const INK = "#16140f";
const MUTED = "#6f6a5e";

function Paper() {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 80% 70% at 40% 30%, #faf7f0 0%, ${PAPER} 60%, #e6dfd0 100%)`,
      }}
    />
  );
}

// ─── Apertura ───────────────────────────────────────────────────────────────

function Opening() {
  const frame = useCurrentFrame();
  const l1 = ease(frame, [4, 20], [0, 1]);
  const l2 = ease(frame, [14, 30], [0, 1]);
  const rule = ease(frame, [24, 50], [0, 1]);
  return (
    <AbsoluteFill style={{ padding: "0 96px", justifyContent: "center", color: INK }}>
      <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase", color: MUTED, opacity: l1 }}>
        Churn involontario
      </div>
      <div style={{ marginTop: 26, fontFamily: SERIF, fontSize: 104, lineHeight: 1.02, letterSpacing: -1.5 }}>
        <div style={{ opacity: l1, transform: `translateY(${(1 - l1) * 24}px)` }}>3 motivi per cui</div>
        <div style={{ opacity: l1, transform: `translateY(${(1 - l1) * 24}px)` }}>perdi clienti</div>
        <div style={{ opacity: l2, transform: `translateY(${(1 - l2) * 24}px)`, fontStyle: "italic", color: MUTED }}>senza che abbiano disdetto.</div>
      </div>
      <div style={{ marginTop: 50, height: 3, width: 300 * rule, background: INK }} />
    </AbsoluteFill>
  );
}

// ─── I tre motivi ───────────────────────────────────────────────────────────

type Reason = {
  number: string;
  title: string;
  codes: string[];
  fix: string;
  card: { holder: string; last4: string; expiry: string; tone: [string, string] };
  stamp: string;
};

const REASONS: Reason[] = [
  {
    number: "01",
    title: "La carta è scaduta",
    codes: ["expired_card"],
    fix: "OmniRev invia subito al cliente un'email con un link sicuro. Nessun tentativo a vuoto.",
    card: { holder: "Giulia Fontana", last4: "4417", expiry: "09/25", tone: ["#24324f", "#0d1424"] },
    stamp: "Scaduta",
  },
  {
    number: "02",
    title: "Mancano i fondi",
    codes: ["insufficient_funds", "SEPA AM04"],
    fix: "OmniRev riprova il 1° o il 15 del mese, quando arrivano gli stipendi.",
    card: { holder: "Marco De Luca", last4: "9032", expiry: "03/28", tone: ["#3f2a52", "#170d22"] },
    stamp: "Fondi insufficienti",
  },
  {
    number: "03",
    title: "La banca ha un problema",
    codes: ["processing_error", "SEPA MS03"],
    fix: "OmniRev riprova da solo dopo 36 ore. Tu non te ne accorgi nemmeno.",
    card: { holder: "Elena Sartori", last4: "1186", expiry: "11/27", tone: ["#1f4a43", "#0a1d1a"] },
    stamp: "Errore temporaneo",
  },
];

function ReasonScene({ reason, duration }: { reason: Reason; duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardIn = spring({ frame: frame - 4, fps, config: { damping: 15, stiffness: 90 } });
  const stampIn = spring({ frame: frame - 26, fps, config: { damping: 9, stiffness: 200 } });
  const titleIn = ease(frame, [0, 14], [0, 1]);
  const codeChars = Math.floor(interpolate(frame, [30, 52], [0, reason.codes.join("  ·  ").length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const fixIn = ease(frame, [58, 74], [0, 1]);
  const t = frame / duration;

  return (
    <AbsoluteFill style={{ color: INK, fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 96, top: 92, display: "flex", alignItems: "baseline", gap: 22, opacity: titleIn }}>
        <span style={{ fontFamily: SERIF, fontSize: 92, color: MUTED, fontStyle: "italic" }}>{reason.number}</span>
        <span style={{ fontFamily: SERIF, fontSize: 76, letterSpacing: -1 }}>{reason.title}</span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 540 - 260,
          top: 280,
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 60}px)`,
        }}
      >
        <PaymentCard {...reason.card} width={520} rotateX={10 - t * 4} rotateY={-18 + t * 12 + (1 - cardIn) * -30} dim={reason.number === "01" ? 0.35 : 0} />
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -30,
            padding: "10px 20px",
            border: "4px solid #c0362c",
            color: "#c0362c",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: 2,
            textTransform: "uppercase",
            background: "rgba(243,239,230,0.85)",
            transform: `rotate(-8deg) scale(${2 - stampIn})`,
            opacity: Math.min(1, stampIn * 1.4),
          }}
        >
          {reason.stamp}
        </div>
      </div>

      <div style={{ position: "absolute", left: 96, right: 96, top: 680 }}>
        <div style={{ fontFamily: MONO, fontSize: 30, color: "#8a3a2f", minHeight: 40 }}>
          {reason.codes.join("  ·  ").slice(0, codeChars)}
          {codeChars < reason.codes.join("  ·  ").length && frame >= 30 && <span style={{ opacity: frame % 16 < 8 ? 1 : 0 }}>▍</span>}
        </div>
        <div style={{ marginTop: 26, display: "flex", gap: 18, alignItems: "flex-start", opacity: fixIn, transform: `translateY(${(1 - fixIn) * 14}px)` }}>
          <div style={{ width: 6, alignSelf: "stretch", borderRadius: 3, background: "linear-gradient(180deg, #10B981, #22D3EE)" }} />
          <div style={{ fontSize: 40, lineHeight: 1.28, fontWeight: 500, letterSpacing: -0.5 }}>{reason.fix}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Chiusura ───────────────────────────────────────────────────────────────

function Closing() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l1 = ease(frame, [0, 14], [0, 1]);
  const draw = ease(frame, [18, 36], [0, 1]);
  const node = spring({ frame: frame - 32, fps, config: { damping: 9, stiffness: 180 } });
  const textIn = ease(frame, [28, 42], [0, 1]);
  const urlIn = ease(frame, [40, 54], [0, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: INK, textAlign: "center" }}>
      <div style={{ fontFamily: SERIF, fontSize: 84, lineHeight: 1.05, letterSpacing: -1, opacity: l1, transform: `translateY(${(1 - l1) * 20}px)` }}>
        Non sono clienti persi.
        <br />
        <span style={{ fontStyle: "italic", color: MUTED }}>Sono pagamenti da recuperare.</span>
      </div>
      <div style={{ marginTop: 80, opacity: draw > 0 ? 1 : 0 }}>
        <Wordmark size={84} draw={draw} node={node} textIn={textIn} color={INK} nodeColor={BRAND_NODE_COLOR.light} />
      </div>
      <div style={{ marginTop: 34, fontFamily: FONT, fontSize: 32, fontWeight: 600, opacity: urlIn }}>
        omnirev.app <span style={{ color: MUTED, fontWeight: 500 }}>· beta gratuita per aziende</span>
      </div>
    </AbsoluteFill>
  );
}

// ─── Composizione ───────────────────────────────────────────────────────────

const OPENING = 96;
const REASON = 132;
const CLOSING_FROM = OPENING + REASON * 3;

export function OmniRevLinkedIn() {
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Paper />
      <Sequence durationInFrames={OPENING}>
        <Cut duration={OPENING} fade={8}>
          <Opening />
        </Cut>
      </Sequence>
      {REASONS.map((reason, index) => (
        <Sequence key={reason.number} from={OPENING + index * REASON} durationInFrames={REASON}>
          <Cut duration={REASON} fade={8}>
            <ReasonScene reason={reason} duration={REASON} />
          </Cut>
        </Sequence>
      ))}
      <Sequence from={CLOSING_FROM}>
        <Cut duration={600 - CLOSING_FROM} hold fade={8}>
          <Closing />
        </Cut>
      </Sequence>
      <FilmFinish grain={0.09} vignette={0.25} />
      <LinkedInAudio />
    </AbsoluteFill>
  );
}

function LinkedInAudio() {
  return (
    <>
      <Music name="linkedin" volume={0.8} />
      {REASONS.map((reason, index) => {
        const at = OPENING + index * REASON;
        return (
          <Sequence key={reason.number} from={at} layout="none">
            <Sfx name="whoosh" at={0} volume={0.25} />
            <Sfx name="tap" at={26} volume={0.8} />
            <Sfx name="typing" at={30} duration={24} volume={0.35} />
          </Sequence>
        );
      })}
      <Sfx name="chime" at={CLOSING_FROM + 32} volume={0.3} />
    </>
  );
}
