// Reel social (Instagram/TikTok/Shorts): 15 s, 1080×1920, 30 fps, montato
// sui battiti della base a 120 bpm (1 battito = 15 frame). Stile "registrazione
// dello schermo" in POV: lunedì 7 pagamenti falliti, entro venerdì tornano
// verdi uno alla volta con il motivo reale e la strategia applicata.
// Testi grandi al centro, fuori dalle aree coperte dall'interfaccia dei social
// (barra destra e didascalia in basso). Nomi e importi di finzione.
import type { CSSProperties } from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { Cut, ease, FilmFinish, FONT, Music, SCREEN, Sfx, StatusBar, Wordmark } from "./kit";

export const OMNIREV_REEL = {
  id: "OmniRevReel",
  fps: 30,
  durationInFrames: 450,
  width: 1080,
  height: 1920,
} as const;

const BEAT = 15;
/** Fattore di scala dello schermo logico (393 px) sulla larghezza del video. */
const SCALE = 1080 / SCREEN.width;

type Payment = { name: string; reason: string; fix: string; amount: number; day: string };

// Ordine = ordine di recupero, allineato alle didascalie (2 per motivo).
const PAYMENTS: Payment[] = [
  { name: "Studio Ricci", reason: "Carta scaduta", fix: "Link al cliente", amount: 590, day: "lun" },
  { name: "Hotel Belvedere", reason: "Carta scaduta", fix: "Link al cliente", amount: 1450, day: "mar" },
  { name: "Bottega Verde Bio", reason: "Fondi insufficienti", fix: "Ritentato il 1°", amount: 1290, day: "sab" },
  { name: "Studio Tecnico Neri", reason: "Fondi insufficienti", fix: "Ritentato il 1°", amount: 610, day: "sab" },
  { name: "Palestra Kinetic", reason: "Errore della banca", fix: "Ritentato dopo 36 h", amount: 240, day: "mer" },
  { name: "Ottica Galli", reason: "Errore della banca", fix: "Ritentato dopo 36 h", amount: 310, day: "mer" },
  { name: "Caseificio Martini", reason: "Carta rifiutata", fix: "Link al cliente", amount: 380, day: "mar" },
];
const TOTAL = PAYMENTS.reduce((sum, p) => sum + p.amount, 0);

const eur = (value: number) => `€${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

/** Frame in cui il pagamento `index` torna verde (dal battito 8, uno per battito). */
const recoveredAt = (index: number) => (8 + index) * BEAT;

// ─── Schermo: app dei pagamenti generica ────────────────────────────────────

function PaymentsApp() {
  const frame = useCurrentFrame();
  const recovered = PAYMENTS.filter((_, index) => frame >= recoveredAt(index));
  const recoveredSum = recovered.reduce((sum, p) => sum + p.amount, 0);
  const day = frame < 6 * BEAT ? "Lunedì" : frame < recoveredAt(PAYMENTS.length - 1) ? "Questa settimana" : "Venerdì";

  return (
    <div style={{ width: SCREEN.width, height: 1920 / SCALE, background: "#f2f2f7", position: "relative", fontFamily: FONT, overflow: "hidden" }}>
      <StatusBar time={frame < 6 * BEAT ? "8:02" : "18:40"} dark />
      <div style={{ padding: "58px 18px 0" }}>
        <div style={{ fontSize: 15, color: "#8e8e93", fontWeight: 600 }}>{day}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#000", letterSpacing: -0.6 }}>Pagamenti</div>
        <div style={{ marginTop: 12, padding: 16, borderRadius: 16, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: "#8e8e93" }}>{recoveredSum > 0 ? "Recuperati" : "Non riusciti"}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: recoveredSum > 0 ? "#1a7f3c" : "#c0362c", fontVariantNumeric: "tabular-nums" }}>
              {recoveredSum > 0 ? `+${eur(recoveredSum)}` : `−${eur(TOTAL)}`}
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#8e8e93", textAlign: "right" }}>
            {recovered.length}/{PAYMENTS.length}
            <br />
            recuperati
          </div>
        </div>
        <div style={{ marginTop: 14, borderRadius: 16, background: "#fff", overflow: "hidden" }}>
          {PAYMENTS.map((payment, index) => {
            const ok = frame >= recoveredAt(index);
            const flip = ease(frame, [recoveredAt(index), recoveredAt(index) + 6], [0, 1]);
            return (
              <div
                key={payment.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "11px 14px",
                  borderBottom: index < PAYMENTS.length - 1 ? "0.5px solid #e5e5ea" : undefined,
                  background: ok ? `rgba(52,199,89,${0.12 * (1 - flip) + 0.04})` : "#fff",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    background: ok ? "#34c759" : "#ff3b30",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 16,
                    transform: `scale(${ok ? 0.85 + flip * 0.15 : 1})`,
                  }}
                >
                  {ok ? "✓" : "!"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#000" }}>{payment.name}</div>
                  <div style={{ fontSize: 12.5, color: ok ? "#1a7f3c" : "#8e8e93" }}>{ok ? `${payment.fix} · ${payment.day}` : payment.reason}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: ok ? "#1a7f3c" : "#c0362c", fontVariantNumeric: "tabular-nums" }}>{eur(payment.amount)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Didascalie "social": grandi, bianche con contorno ──────────────────────

type CaptionCue = { from: number; to: number; text: string; accent?: string };

const CAPTIONS: CaptionCue[] = [
  { from: 0, to: 2 * BEAT, text: "POV: lunedì apri i pagamenti" },
  { from: 2 * BEAT, to: 4 * BEAT, text: "7 non riusciti.", accent: "−€4.870" },
  { from: 4 * BEAT, to: 6 * BEAT, text: "Non fai niente.", accent: "Davvero." },
  { from: 8 * BEAT, to: 10 * BEAT, text: "Carta scaduta?", accent: "Link al cliente." },
  { from: 10 * BEAT, to: 12 * BEAT, text: "Fondi insufficienti?", accent: "Riprova il 1° del mese." },
  { from: 12 * BEAT, to: 14 * BEAT, text: "Errore della banca?", accent: "Riprova dopo 36 ore." },
  { from: 15 * BEAT, to: 18 * BEAT, text: "Venerdì:", accent: "+€4.870 recuperati" },
  { from: 18 * BEAT, to: 26 * BEAT, text: "Zero email scritte da te.", accent: "Zero telefonate." },
];

function Captions() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = CAPTIONS.find((c) => frame >= c.from && frame < c.to);
  if (!cue) return null;
  const pop = spring({ frame: frame - cue.from, fps, config: { damping: 12, stiffness: 220 } });
  const accentPop = spring({ frame: frame - cue.from - 6, fps, config: { damping: 12, stiffness: 220 } });
  const stroke: CSSProperties = {
    color: "#fff",
    WebkitTextStroke: "14px #000",
    paintOrder: "stroke fill",
    textShadow: "0 8px 24px rgba(0,0,0,0.35)",
  };

  return (
    <div style={{ position: "absolute", top: 620, left: 70, right: 150, textAlign: "center", fontFamily: FONT, fontWeight: 800, letterSpacing: -1 }}>
      <div style={{ fontSize: 92, lineHeight: 1.05, transform: `scale(${0.7 + pop * 0.3})`, opacity: Math.min(1, pop * 1.5), ...stroke }}>{cue.text}</div>
      {cue.accent && (
        <div
          style={{
            marginTop: 26,
            display: "inline-block",
            fontSize: 76,
            lineHeight: 1.1,
            padding: "10px 26px",
            borderRadius: 18,
            background: cue.accent.startsWith("−") ? "#ff3b30" : cue.accent.startsWith("+") ? "#34c759" : "#ffd60a",
            color: cue.accent.startsWith("−") || cue.accent.startsWith("+") ? "#fff" : "#000",
            transform: `scale(${0.6 + accentPop * 0.4}) rotate(${(1 - accentPop) * -6}deg)`,
            opacity: Math.min(1, accentPop * 1.5),
          }}
        >
          {cue.accent}
        </div>
      )}
    </div>
  );
}

// ─── Scene ──────────────────────────────────────────────────────────────────

/** Schermo a tutto quadro con leggero movimento "a mano" e zoom sui battiti. */
function ScreenRecording() {
  const frame = useCurrentFrame();
  const shakeX = Math.sin(frame / 7) * 4 + Math.sin(frame / 3.1) * 1.5;
  const shakeY = Math.cos(frame / 9) * 5 + Math.sin(frame / 2.7) * 1.2;
  const rotate = Math.sin(frame / 11) * 0.35;
  // Colpo di zoom sul drop (battito 4) e su ogni recupero.
  const punch = (at: number) => interpolate(frame, [at, at + 3, at + 10], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = 1.04 + punch(4 * BEAT) * 0.06 + PAYMENTS.reduce((sum, _, index) => sum + punch(recoveredAt(index)) * 0.015, 0);
  // Prima del drop lo schermo è più scuro, come "appena sveglio".
  const dimmed = interpolate(frame, [0, 4 * BEAT - 2, 4 * BEAT], [0.35, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Movimento "a mano" e zoom attorno al centro del quadro… */}
      <AbsoluteFill style={{ transformOrigin: "50% 45%", transform: `translate(${shakeX}px, ${shakeY}px) rotate(${rotate}deg) scale(${zoom})` }}>
        {/* …sullo schermo logico portato alla larghezza del video. */}
        <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `scale(${SCALE})` }}>
          <PaymentsApp />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(0,0,0,${dimmed})` }} />
      {/* Scuro dietro le didascalie per leggibilità */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 22% at 50% 42%, rgba(0,0,0,0.35), transparent 70%)" }} />
    </AbsoluteFill>
  );
}

function EndCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = ease(frame, [0, 14], [0, 1]);
  const node = spring({ frame: frame - 10, fps, config: { damping: 9, stiffness: 180 } });
  const textIn = ease(frame, [6, 18], [0, 1]);
  const ctaIn = spring({ frame: frame - 18, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ background: "#050505", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "#fff" }}>
      <Wordmark size={130} draw={draw} node={node} textIn={textIn} />
      <div style={{ marginTop: 50, fontSize: 56, fontWeight: 700, textAlign: "center", lineHeight: 1.15, letterSpacing: -1.2, opacity: textIn }}>
        Recupera da solo
        <br />i pagamenti falliti.
      </div>
      <div
        style={{
          marginTop: 60,
          padding: "24px 48px",
          borderRadius: 999,
          background: "#fff",
          color: "#000",
          fontSize: 44,
          fontWeight: 800,
          transform: `scale(${0.8 + ctaIn * 0.2})`,
          opacity: ctaIn,
        }}
      >
        omnirev.app
      </div>
      <div style={{ marginTop: 26, fontSize: 32, color: "rgba(255,255,255,0.7)", opacity: ctaIn }}>Beta gratuita · link in bio</div>
    </AbsoluteFill>
  );
}

export function OmniRevReel() {
  const endAt = 26 * BEAT;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={endAt}>
        <Cut duration={endAt} fade={3}>
          <ScreenRecording />
          <Captions />
        </Cut>
      </Sequence>
      <Sequence from={endAt}>
        <EndCard />
      </Sequence>
      <FilmFinish grain={0.05} vignette={0.35} />
      <ReelAudio />
    </AbsoluteFill>
  );
}

function ReelAudio() {
  return (
    <>
      <Music name="reel" volume={0.85} />
      <Sfx name="whoosh" at={4 * BEAT - 10} volume={0.35} />
      {PAYMENTS.map((_, index) => (
        <Sfx key={index} name="tick" at={recoveredAt(index)} volume={0.6} />
      ))}
      <Sfx name="chime" at={15 * BEAT} volume={0.35} />
      <Sfx name="whoosh-down" at={26 * BEAT - 8} volume={0.3} />
    </>
  );
}
