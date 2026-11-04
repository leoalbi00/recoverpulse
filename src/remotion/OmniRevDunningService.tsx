// Spot "Dunning su misura" (25 s, 1920×1080). Parla del servizio e del suo
// valore economico per il merchant, non del software: niente dashboard né
// grafici, solo il problema reale, i dati e la soluzione su dispositivi.
//   hook       fino al 15% dei pagamenti ricorrenti fallisce ogni mese;
//   problema   oltre il 40% del churn non è voluto: è un pagamento fallito;
//   servizio   un dunning sartoriale, a nome del merchant;
//   cliente    la carta viene aggiornata e il pagamento passa;
//   risultato  fino al 65% dei pagamenti falliti torna in cassa;
//   chiusura   logo, posizionamento e dominio.
// Nomi (Nimbus CRM, clienti) e importi sono di finzione. I dati statistici
// vengono dal brief: prima della diffusione vanno citate le fonti.
// Componenti comuni in ./kit.tsx; base musicale "music-dunning" generata da
// scripts/generate-spot-audio.mjs.
import type { ReactNode } from "react";
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";

import {
  BrandMark,
  Cut,
  ease,
  Environment,
  FilmFinish,
  FONT,
  LockScreen,
  MerchantBadge,
  Music,
  Notification,
  PaymentCard,
  Phone,
  Sfx,
  Tap,
  WALLPAPERS,
} from "./kit";

export const OMNIREV_DUNNING_SERVICE = {
  id: "OmniRevDunningService",
  fps: 30,
  durationInFrames: 750,
  width: 1920,
  height: 1080,
} as const;

const MERCHANT = "Nimbus CRM";
const MERCHANT_COLORS: [string, string] = ["#ff7a45", "#e8432f"];

/** Accenti: rosso per il problema, gradiente del marchio per il risultato. */
const LOSS = "#ff5a4e";
const GAIN = "linear-gradient(90deg, #10B981 0%, #22D3EE 60%, #818CF8 100%)";

// ─── Testi: dato statistico e didascalia ────────────────────────────────────

/** Riga di testo che entra dal basso con leggera sfocatura. */
function Line({ at, children, size = 60, weight = 600, color = "#fff" }: { at: number; children: ReactNode; size?: number; weight?: number; color?: string }) {
  const frame = useCurrentFrame();
  const opacity = ease(frame, [at, at + 16], [0, 1]);
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: weight,
        letterSpacing: size * -0.028,
        lineHeight: 1.14,
        color,
        opacity,
        transform: `translateY(${(1 - opacity) * 24}px)`,
        filter: `blur(${(1 - opacity) * 6}px)`,
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ at, children }: { at: number; children: string }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: 5, color: "rgba(255,255,255,0.55)", opacity: ease(frame, [at, at + 12], [0, 1]) }}>
      {children}
    </div>
  );
}

/** Blocco di testo a sinistra, centrato in verticale, nell'area title safe. */
function TextBlock({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: "absolute", left: 180, top: 540, transform: "translateY(-50%)", width: 880, fontFamily: FONT, color: "#fff" }}>{children}</div>
  );
}

/** Dato statistico: numero che conta fino a `value` con prefisso ("fino al") e frase di contesto. */
function Stat({
  eyebrow,
  prefix,
  value,
  accent,
  lines,
  note,
  at = 4,
}: {
  eyebrow: string;
  prefix: string;
  value: number;
  /** Colore pieno o gradiente CSS. */
  accent: string;
  lines: string[];
  note?: string;
  at?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numberIn = spring({ frame: frame - (at + 4), fps, config: { damping: 18, stiffness: 120 } });
  const count = Math.round(ease(frame, [at + 6, at + 44], [0, value]));
  const linesAt = at + 26;
  return (
    <TextBlock>
      <Eyebrow at={at}>{eyebrow}</Eyebrow>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 22,
          marginTop: 14,
          opacity: numberIn,
          transform: `translateY(${(1 - numberIn) * 30}px)`,
        }}
      >
        <span style={{ fontSize: 46, fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>{prefix}</span>
        <span
          style={{
            fontSize: 220,
            fontWeight: 700,
            letterSpacing: -9,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            background: accent,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {count}%
        </span>
      </div>
      <div style={{ marginTop: 20 }}>
        {lines.map((line, index) => (
          <Line key={line} at={linesAt + index * 8}>
            {line}
          </Line>
        ))}
      </div>
      {note && (
        <div style={{ marginTop: 26 }}>
          <Line at={linesAt + lines.length * 8 + 10} size={40} weight={500} color="rgba(255,255,255,0.62)">
            {note}
          </Line>
        </div>
      )}
    </TextBlock>
  );
}

// ─── Scena 1 · hook: i pagamenti che falliscono ─────────────────────────────

const FAILURES = [
  { when: "ora", body: "Studio Rossi · €49,00 · Carta scaduta." },
  { when: "2 g fa", body: "Marco Bellini · €129,00 · Fondi insufficienti." },
  { when: "4 g fa", body: "Ferri & Co. · €290,00 · Limite superato." },
  { when: "6 g fa", body: "Officina Luce · €49,00 · Bloccato dalla banca." },
  { when: "9 g fa", body: "Laura Neri · €99,00 · Carta scaduta." },
];
/** Frame di arrivo di ogni notifica (sincronizzati con gli SFX). */
const FAILURE_AT = [12, 24, 36, 48, 60];

function HookScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = ease(frame, [0, 16], [0, 1]);
  // Vibrazione a ogni notifica.
  const since = Math.min(...FAILURE_AT.map((at) => (frame >= at ? frame - at : Infinity)));
  const shake = since < 10 ? Math.sin(since * 3.2) * 3 : 0;

  return (
    <AbsoluteFill>
      <Environment mood="night" seed="dunning-hook" />
      <Phone duration={duration} x={1380} enter={phoneIn} shake={shake} tilt={[-16, -9]}>
        <LockScreen time="23:47" date="venerdì 30 ottobre" wallpaper={WALLPAPERS.night} top={270}>
          {FAILURES.map((failure, index) => (
            <Notification
              key={failure.body}
              when={failure.when}
              title="Pagamento non riuscito"
              body={failure.body}
              enter={spring({ frame: frame - FAILURE_AT[index], fps, config: { damping: 16, stiffness: 150 } })}
              dim={index > 0}
            />
          ))}
        </LockScreen>
      </Phone>
      <Stat eyebrow="OGNI MESE" prefix="fino al" value={15} accent={LOSS} lines={["dei pagamenti ricorrenti", "fallisce."]} at={2} />
    </AbsoluteFill>
  );
}

// ─── Scena 2 · churn involontario: la carta scaduta ─────────────────────────

const REASONS = ["Carta scaduta", "Limite raggiunto", "Blocco della banca"];

function ChurnScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / duration;
  const cardIn = spring({ frame: frame - 4, fps, config: { damping: 20, stiffness: 90 } });
  const expired = ease(frame, [36, 60], [0, 1]);
  const stamp = spring({ frame: frame - 58, fps, config: { damping: 11, stiffness: 190 } });

  return (
    <AbsoluteFill>
      <Environment mood="neutral" seed="dunning-churn" />
      <div
        style={{
          position: "absolute",
          left: 1390 - 300,
          top: 470 - 190,
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 80}px) scale(${1 + t * 0.05})`,
        }}
      >
        <PaymentCard holder="Laura Neri" last4="0417" expiry="09/26" width={600} rotateY={-18 + t * 10} rotateX={10} dim={expired} />
        <div
          style={{
            position: "absolute",
            left: 330,
            top: 70,
            padding: "10px 26px",
            border: `5px solid ${LOSS}`,
            borderRadius: 14,
            color: LOSS,
            fontFamily: FONT,
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: 6,
            background: "rgba(10,10,12,0.55)",
            opacity: stamp > 0 ? Math.min(1, stamp * 1.4) : 0,
            transform: `rotate(-12deg) scale(${1.6 - stamp * 0.6})`,
          }}
        >
          SCADUTA
        </div>
      </div>
      <div style={{ position: "absolute", left: 1390 - 300, top: 760, display: "flex", gap: 14, fontFamily: FONT }}>
        {REASONS.map((reason, index) => {
          const chipIn = ease(frame, [64 + index * 8, 78 + index * 8], [0, 1]);
          return (
            <div
              key={reason}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                fontSize: 26,
                fontWeight: 500,
                color: index === 0 ? "#fff" : "rgba(255,255,255,0.8)",
                background: index === 0 ? "rgba(255,90,78,0.28)" : "rgba(255,255,255,0.1)",
                border: `1px solid ${index === 0 ? "rgba(255,90,78,0.7)" : "rgba(255,255,255,0.22)"}`,
                opacity: chipIn,
                transform: `translateY(${(1 - chipIn) * 16}px)`,
              }}
            >
              {reason}
            </div>
          );
        })}
      </div>
      <Stat
        eyebrow="CHURN INVOLONTARIO"
        prefix="oltre il"
        value={40}
        accent={LOSS}
        lines={["dei clienti che perdi", "non voleva andarsene."]}
        note="È solo un pagamento che non passa."
      />
    </AbsoluteFill>
  );
}

// ─── Scena 3 · il servizio: dunning su misura, a nome del merchant ──────────

const MESSAGES = [
  { when: "lun", body: "Ciao Laura, il rinnovo non è passato. Nessun problema: si sistema in un attimo." },
  { when: "gio", body: "Il tuo account è ancora attivo. Aggiorna la carta in dieci secondi." },
  { when: "ora", body: "Laura, ecco il tuo link sicuro per completare il rinnovo." },
];
const MESSAGE_AT = [18, 38, 58];
const SERVICE_POINTS = ["Email e avvisi con il tuo marchio", "Tempi e toni scelti per ogni cliente", "Zero attrito, zero ticket"];

function ServiceScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = ease(frame, [0, 16], [0, 1]);

  return (
    <AbsoluteFill>
      <Environment mood="office" seed="dunning-service" />
      <Phone duration={duration} x={1380} enter={phoneIn} tilt={[-12, -5]}>
        <LockScreen time="9:30" date="lunedì 2 novembre" wallpaper={WALLPAPERS.dusk}>
          {MESSAGES.map((message, index) => (
            <Notification
              key={message.when}
              app="Mail"
              icon={<MerchantBadge size={38} letter="N" colors={MERCHANT_COLORS} />}
              when={message.when}
              title={MERCHANT}
              body={message.body}
              enter={spring({ frame: frame - MESSAGE_AT[index], fps, config: { damping: 17, stiffness: 140 } })}
              dim={index < MESSAGES.length - 1}
            />
          ))}
        </LockScreen>
        <Tap x={196} y={TAP_Y} at={TAP_AT} />
      </Phone>
      <TextBlock>
        <Eyebrow at={4}>IL SERVIZIO</Eyebrow>
        <div style={{ marginTop: 22 }}>
          <Line at={10} size={72}>
            Un dunning su misura.
          </Line>
          <Line at={20} size={72} color="rgba(255,255,255,0.6)">
            A nome tuo.
          </Line>
        </div>
        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 18 }}>
          {SERVICE_POINTS.map((point, index) => (
            <Line key={point} at={48 + index * 16} size={40} weight={500}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 20 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 18px rgba(16,185,129,0.8)" }} />
                {point}
              </span>
            </Line>
          ))}
        </div>
      </TextBlock>
    </AbsoluteFill>
  );
}

/** Tocco sull'ultimo messaggio (coordinate nello schermo del telefono). */
const TAP_AT = 128;
const TAP_Y = 538;

// ─── Scena 4 · il cliente aggiorna la carta ─────────────────────────────────

function UpdateScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const oldOut = ease(frame, [10, 34], [0, 1]);
  const newIn = spring({ frame: frame - 22, fps, config: { damping: 18, stiffness: 110 } });
  const success = spring({ frame: frame - SUCCESS_AT, fps, config: { damping: 13, stiffness: 170 } });

  return (
    <AbsoluteFill>
      <Environment mood="morning" seed="dunning-update" />
      <div style={{ position: "absolute", left: 1390 - 300, top: 440 - 190 }}>
        <div style={{ position: "absolute", opacity: 1 - oldOut, transform: `translate(${-oldOut * 260}px, ${oldOut * 140}px) rotate(${-oldOut * 14}deg)` }}>
          <PaymentCard holder="Laura Neri" last4="0417" expiry="09/26" width={600} dim={1} />
        </div>
        <div style={{ position: "absolute", opacity: newIn, transform: `translateX(${(1 - newIn) * 340}px) rotate(${(1 - newIn) * 10}deg)` }}>
          <PaymentCard holder="Laura Neri" last4="8841" expiry="09/30" width={600} tone={["#283478", "#0c1033"]} rotateY={-10} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1390 - 230,
          top: 720,
          width: 460,
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "18px 26px",
          borderRadius: 22,
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
          fontFamily: FONT,
          opacity: Math.min(1, success * 1.2),
          transform: `translateY(${(1 - success) * 30}px) scale(${0.9 + success * 0.1})`,
        }}
      >
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1f9d55", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#1c1c1e" }}>Pagamento riuscito</div>
          <div style={{ fontSize: 20, color: "#6e6e73", marginTop: 2 }}>{MERCHANT} · rinnovo €99,00</div>
        </div>
      </div>
      <TextBlock>
        <Eyebrow at={4}>IL TUO CLIENTE</Eyebrow>
        <div style={{ marginTop: 22 }}>
          <Line at={10} size={72}>
            Aggiorna la carta
          </Line>
          <Line at={18} size={72}>
            in pochi secondi.
          </Line>
        </div>
        <div style={{ marginTop: 26 }}>
          <Line at={SUCCESS_AT + 4} size={40} weight={500} color="rgba(255,255,255,0.62)">
            Nessuna chiamata. Il rinnovo passa.
          </Line>
        </div>
      </TextBlock>
    </AbsoluteFill>
  );
}

const SUCCESS_AT = 58;

// ─── Scena 5 · il risultato: il fatturato torna a scorrere ──────────────────

const RECOVERED = [
  { when: "ora", body: "Laura Neri · €99,00 recuperati." },
  { when: "ora", body: "Ferri & Co. · €290,00 recuperati." },
  { when: "ora", body: "Marco Bellini · €129,00 recuperati." },
  { when: "ora", body: "Studio Rossi · €49,00 recuperati." },
];
const RECOVERED_AT = [14, 26, 38, 50];

function ResultScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = ease(frame, [0, 14], [0, 1]);

  return (
    <AbsoluteFill>
      <Environment mood="day" seed="dunning-result" />
      <Phone duration={duration} x={1380} enter={phoneIn} tilt={[-8, -3]} push={[1.02, 1.09]}>
        <LockScreen time="15:20" date="martedì 3 novembre" wallpaper={WALLPAPERS.sea}>
          {RECOVERED.map((payment, index) => (
            <Notification
              key={payment.body}
              when={payment.when}
              title="Pagamento ricevuto"
              body={payment.body}
              enter={spring({ frame: frame - RECOVERED_AT[index], fps, config: { damping: 15, stiffness: 150 } })}
            />
          ))}
        </LockScreen>
      </Phone>
      <Stat
        eyebrow="IL RISULTATO"
        prefix="fino al"
        value={65}
        accent={GAIN}
        lines={["dei pagamenti falliti", "torna in cassa."]}
        note="Mentre tu continui a lavorare."
      />
    </AbsoluteFill>
  );
}

// ─── Scena 6 · chiusura ─────────────────────────────────────────────────────

function EndScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = ease(frame, [0, 24], [0, 1]);
  const node = spring({ frame: frame - 18, fps, config: { damping: 9, stiffness: 180 } });
  const wordmarkIn = ease(frame, [10, 26], [0, 1]);
  const lineIn = ease(frame, [24, 40], [0, 1]);
  const urlIn = ease(frame, [34, 48], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#050505", fontFamily: FONT, color: "#fff", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <BrandMark size={112} draw={draw} node={node} />
        <span style={{ fontSize: 92, fontWeight: 600, letterSpacing: "-0.035em", opacity: wordmarkIn, transform: `translateX(${(1 - wordmarkIn) * -20}px)` }}>
          Omni<span style={{ color: "rgba(255,255,255,0.7)" }}>Rev</span>
        </span>
      </div>
      <div
        style={{
          marginTop: 40,
          fontSize: 42,
          fontWeight: 500,
          color: "rgba(255,255,255,0.78)",
          letterSpacing: -0.6,
          opacity: lineIn,
          transform: `translateY(${(1 - lineIn) * 16}px)`,
        }}
      >
        Il dunning su misura che recupera i tuoi pagamenti falliti.
      </div>
      <div
        style={{
          marginTop: 34,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: 1,
          padding: "14px 30px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.3)",
          opacity: urlIn,
        }}
      >
        omnirev.app
      </div>
    </AbsoluteFill>
  );
}

// ─── Composizione ───────────────────────────────────────────────────────────

const SCENES = [
  { from: 0, duration: 120, name: "Hook", Component: HookScene },
  { from: 120, duration: 135, name: "Churn involontario", Component: ChurnScene },
  { from: 255, duration: 165, name: "Servizio", Component: ServiceScene },
  { from: 420, duration: 120, name: "Cliente", Component: UpdateScene },
  { from: 540, duration: 105, name: "Risultato", Component: ResultScene },
  { from: 645, duration: 105, name: "Chiusura", Component: EndScene },
];

export function OmniRevDunningService() {
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {SCENES.map(({ from, duration, name, Component }, index) => (
        <Sequence key={from} from={from} durationInFrames={duration} name={name}>
          <Cut duration={duration} hold={index === SCENES.length - 1}>
            <Component duration={duration} />
          </Cut>
        </Sequence>
      ))}
      <FilmFinish />
      <DunningAudio />
    </AbsoluteFill>
  );
}

/** Colonna sonora: base "music-dunning" ed effetti sincronizzati con le scene (frame assoluti). */
function DunningAudio() {
  return (
    <>
      <Music name="dunning" volume={0.75} />
      {/* Hook: una vibrazione e una notifica per ogni pagamento fallito. */}
      {FAILURE_AT.map((at) => (
        <Sfx key={at} name="buzz" at={at} volume={0.55} />
      ))}
      <Sfx name="ambience-night" at={0} duration={120} volume={0.45} />
      {/* Churn: la carta entra e si spegne. */}
      <Sfx name="whoosh" at={122} volume={0.3} />
      <Sfx name="whoosh-down" at={156} volume={0.35} />
      <Sfx name="tap" at={178} volume={0.6} />
      {/* Servizio: i messaggi del merchant, poi il tocco sul link. */}
      {MESSAGE_AT.map((at) => (
        <Sfx key={at} name="ping" at={255 + at} volume={0.3} />
      ))}
      <Sfx name="tap" at={255 + TAP_AT} volume={0.7} />
      {/* Cliente: cambio carta e conferma. */}
      <Sfx name="whoosh" at={432} volume={0.35} />
      <Sfx name="chime" at={420 + SUCCESS_AT} volume={0.45} />
      {/* Risultato: i pagamenti recuperati arrivano uno dopo l'altro. */}
      {RECOVERED_AT.map((at) => (
        <Sfx key={at} name="ping" at={540 + at} volume={0.32} />
      ))}
    </>
  );
}
