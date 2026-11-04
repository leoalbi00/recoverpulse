// Spot TV "24 ore" (30 s, 1920×1080, 25 fps come da standard broadcast PAL).
// Tre pagamenti falliti in tre momenti della giornata, ciascuno risolto con
// la logica reale del prodotto (src/lib/dunning-error-categorization.ts):
//   02:47  addebito SEPA respinto per fondi insufficienti → nuovo tentativo
//          il giorno di accredito stipendi (1° o 15 del mese);
//   13:30  carta scaduta → email al cliente, aggiornamento in un tocco;
//   21:08  errore temporaneo della banca → nuovo tentativo dopo 36 ore.
// Testi entro l'area "title safe" (90% del quadro). Nomi e importi di finzione.
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";

import {
  Cut,
  ease,
  Environment,
  FilmFinish,
  FONT,
  Laptop,
  LockScreen,
  MailIcon,
  MerchantBadge,
  Music,
  Notification,
  Phone,
  Sfx,
  StatusBar,
  Tap,
  useSeconds,
  WALLPAPERS,
  Wordmark,
} from "./kit";

export const OMNIREV_TV = {
  id: "OmniRevTV30",
  fps: 25,
  durationInFrames: 750,
  width: 1920,
  height: 1080,
} as const;

// ─── Didascalia TV: centrata in basso, dentro l'area title safe ─────────────

function LowerThird({ time, label, text, at = 6 }: { time: string; label: string; text: string; at?: number }) {
  const frame = useCurrentFrame();
  const chip = ease(frame, [at, at + 10], [0, 1]);
  const line = ease(frame, [at + 6, at + 18], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "120px 0 84px",
        textAlign: "center",
        fontFamily: FONT,
        color: "#fff",
        background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,${0.75 * chip}) 70%)`,
      }}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: 16, opacity: chip, transform: `translateY(${(1 - chip) * 10}px)` }}>
        <span style={{ fontSize: 30, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: 2 }}>{time}</span>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.6)" }} />
        <span style={{ fontSize: 26, fontWeight: 500, color: "rgba(255,255,255,0.75)", letterSpacing: 3, textTransform: "uppercase" }}>{label}</span>
      </div>
      <div
        style={{
          marginTop: 18,
          fontSize: 58,
          fontWeight: 600,
          letterSpacing: -1.4,
          opacity: line,
          transform: `translateY(${(1 - line) * 16}px)`,
          textShadow: "0 4px 30px rgba(0,0,0,0.6)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ─── 0–3.2 s · L'orologio ───────────────────────────────────────────────────

function ClockScene() {
  const frame = useCurrentFrame();
  const s = useSeconds();
  // Dalle 23:58 alle 02:47 con accelerazione e frenata (169 minuti).
  const minutes = Math.round(ease(frame, [0, s(2.6)], [0, 169]));
  const total = (23 * 60 + 58 + minutes) % (24 * 60);
  const label = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  const textIn = ease(frame, [s(1.2), s(1.8)], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#050506", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "#fff" }}>
      <div style={{ fontSize: 260, fontWeight: 300, letterSpacing: -6, fontVariantNumeric: "tabular-nums", textShadow: "0 0 60px rgba(255,255,255,0.15)" }}>{label}</div>
      <div style={{ marginTop: 10, fontSize: 40, fontWeight: 500, color: "rgba(255,255,255,0.7)", opacity: textIn }}>
        Ogni giorno, a ogni ora, un pagamento può fallire.
      </div>
    </AbsoluteFill>
  );
}

// ─── 3.2–10 s · 02:47, SEPA respinto per fondi insufficienti ────────────────

const SEPA_ROWS = [
  { name: "Studio Legale Ferri", date: "27 ott", amount: "€1.200,00", state: "paid" },
  { name: "Ferramenta Bianchi s.n.c.", date: "27 ott", amount: "€390,00", state: "focus" },
  { name: "Panificio Lombardi", date: "27 ott", amount: "€145,00", state: "paid" },
  { name: "Agenzia Viaggi Sole", date: "26 ott", amount: "€640,00", state: "paid" },
  { name: "Clinica Dentale Riva", date: "26 ott", amount: "€980,00", state: "paid" },
  { name: "Autofficina Gentile", date: "26 ott", amount: "€220,00", state: "paid" },
] as const;

function StatusPill({ tone, children }: { tone: "ok" | "ko" | "wait"; children: string }) {
  const colors = { ok: ["#e7f6ec", "#1a7f3c"], ko: ["#fde8e8", "#b42318"], wait: ["#fff4e5", "#b54708"] }[tone];
  return (
    <span style={{ fontSize: 17, fontWeight: 600, padding: "5px 12px", borderRadius: 999, background: colors[0], color: colors[1], whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function SepaScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const s = useSeconds();
  const plannedAt = s(2.2);
  const lapseAt = s(4.2);
  const paidAt = s(5.0);
  const planned = ease(frame, [plannedAt, plannedAt + 10], [0, 1]);
  const lapse = interpolate(frame, [lapseAt, lapseAt + 8, paidAt - 2, paidAt + 6], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const paid = frame >= paidAt;

  return (
    <AbsoluteFill>
      <Environment mood="office" seed="tv-sepa" />
      <Laptop duration={duration} x={1000} y={445} size={0.74} tilt={[-5, -1]} push={[1, 1.06]}>
        <AbsoluteFill style={{ background: "#f7f7f8", color: "#1d1d1f" }}>
          <div style={{ height: 64, background: "#fff", borderBottom: "1px solid #e6e6e9", display: "flex", alignItems: "center", padding: "0 36px", gap: 14 }}>
            <MerchantBadge size={30} letter="F" colors={["#3b82f6", "#1e40af"]} />
            <span style={{ fontSize: 20, fontWeight: 700 }}>Fiscalis</span>
            <span style={{ fontSize: 17, color: "#6b6b73", marginLeft: 22 }}>Incassi · Addebiti diretti SEPA</span>
            <span style={{ marginLeft: "auto", fontSize: 17, color: "#6b6b73", fontVariantNumeric: "tabular-nums" }}>{paid ? "1 nov, 09:00" : "28 ott, 02:47"}</span>
          </div>
          <div style={{ padding: "30px 36px" }}>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>Addebiti del mese</div>
            <div style={{ marginTop: 22, background: "#fff", borderRadius: 14, border: "1px solid #e6e6e9", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 170px 290px", padding: "14px 24px", fontSize: 15, color: "#8a8a92", borderBottom: "1px solid #eee" }}>
                <span>Cliente</span>
                <span>Data</span>
                <span>Importo</span>
                <span>Stato</span>
              </div>
              {SEPA_ROWS.map((row) => {
                const focus = row.state === "focus";
                return (
                  <div key={row.name}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 140px 170px 290px",
                        alignItems: "center",
                        padding: "17px 24px",
                        fontSize: 18,
                        borderBottom: "1px solid #f0f0f2",
                        background: focus ? (paid ? "#f3fbf6" : "#fff7f7") : "#fff",
                      }}
                    >
                      <span style={{ fontWeight: focus ? 600 : 400 }}>{row.name}</span>
                      <span style={{ color: "#6b6b73" }}>{row.date}</span>
                      <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{row.amount}</span>
                      <span>
                        {!focus ? (
                          <StatusPill tone="ok">Pagato</StatusPill>
                        ) : paid ? (
                          <StatusPill tone="ok">Pagato al nuovo tentativo</StatusPill>
                        ) : (
                          <StatusPill tone="ko">Respinto · AM04</StatusPill>
                        )}
                      </span>
                    </div>
                    {focus && (
                      <div
                        style={{
                          height: 58 * planned,
                          overflow: "hidden",
                          background: paid ? "#f3fbf6" : "#fffaf2",
                          borderBottom: "1px solid #f0f0f2",
                        }}
                      >
                        <div style={{ padding: "16px 24px", fontSize: 17, color: paid ? "#1a7f3c" : "#9a4d06", display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ fontWeight: 700 }}>OmniRev</span>
                          <span>
                            {paid
                              ? "Recuperato il 1 novembre alle 09:00, senza solleciti."
                              : "Fondi insufficienti: nuovo tentativo il 1 novembre alle 09:00, giorno di accredito stipendi."}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Passaggio di tempo: schermo che si abbassa e data che scorre */}
          <AbsoluteFill style={{ background: `rgba(10,10,12,${lapse * 0.85})`, alignItems: "center", justifyContent: "center" }}>
            <div style={{ opacity: lapse, color: "#fff", fontSize: 64, fontWeight: 600, letterSpacing: -1 }}>1 novembre · 09:00</div>
          </AbsoluteFill>
        </AbsoluteFill>
      </Laptop>
      <LowerThird time="02:47" label="Fondi insufficienti" text="OmniRev riprova il giorno dello stipendio." at={s(2.4)} />
    </AbsoluteFill>
  );
}

// ─── 10–17 s · 13:30, carta scaduta ─────────────────────────────────────────

function CardScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useSeconds();
  const notifIn = spring({ frame: frame - s(0.6), fps, config: { damping: 16, stiffness: 140 } });
  const openAt = s(1.8);
  const sheet = ease(frame, [openAt + 2, openAt + 14], [0, 1]);
  const autofill = ease(frame, [s(2.6), s(3.2)], [0, 1]);
  const payAt = s(4.0);
  const doneAt = s(4.8);
  const done = spring({ frame: frame - doneAt, fps, config: { damping: 11, stiffness: 160 } });

  return (
    <AbsoluteFill>
      <Environment mood="day" seed="tv-card" />
      <Phone duration={duration} x={960} y={455} size={0.8} tilt={[8, 2]} push={[1, 1.08]}>
        <LockScreen time="13:30" date="mercoledì 29 ottobre" wallpaper={WALLPAPERS.sea}>
          <Notification
            icon={<MailIcon />}
            app="Mail"
            when="ora"
            title="Kairos Gestionale"
            body="La tua carta è scaduta: aggiorna il pagamento in un tocco."
            enter={notifIn}
          />
        </LockScreen>
        {/* Pagina di aggiornamento aperta dal link */}
        <AbsoluteFill style={{ background: "#f5f5f7", transform: `translateY(${(1 - sheet) * 100}%)`, borderRadius: 30 }}>
          <StatusBar time="13:30" dark />
          <div style={{ padding: "70px 22px 0", color: "#1c1c1e" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MerchantBadge size={30} letter="K" colors={["#14b8a6", "#0f766e"]} />
              <span style={{ fontWeight: 700, fontSize: 19 }}>Kairos Gestionale</span>
            </div>
            <div style={{ marginTop: 24, fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>Aggiorna il metodo di pagamento</div>
            <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1px solid #e5e5ea", display: "flex", justifyContent: "space-between", fontSize: 15 }}>
              <span>Abbonamento mensile</span>
              <span style={{ fontWeight: 700 }}>€89,00</span>
            </div>
            <div style={{ marginTop: 18, fontSize: 13, color: "#6e6e73" }}>Carta</div>
            <div
              style={{
                marginTop: 6,
                height: 48,
                borderRadius: 10,
                border: "1px solid #d2d2d7",
                background: autofill > 0.5 ? "#eef5ff" : "#fff",
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                fontSize: 16,
                justifyContent: "space-between",
              }}
            >
              <span style={{ opacity: autofill }}>•••• •••• •••• 0062</span>
              <span style={{ opacity: autofill, color: "#6e6e73" }}>08/30</span>
            </div>
            <div
              style={{
                marginTop: 22,
                height: 52,
                borderRadius: 12,
                background: frame >= doneAt ? "#1f9d55" : "#0f766e",
                color: "#fff",
                fontWeight: 600,
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${frame >= payAt && frame < payAt + 4 ? 0.97 : 1})`,
              }}
            >
              {frame >= doneAt ? "✓ Pagamento completato" : frame >= payAt ? "Attendere…" : "Aggiorna e paga €89,00"}
            </div>
            <div
              style={{
                marginTop: 34,
                textAlign: "center",
                opacity: done,
                transform: `scale(${0.8 + done * 0.2})`,
                fontSize: 15,
                color: "#6e6e73",
              }}
            >
              Grazie! Il tuo abbonamento resta attivo.
            </div>
          </div>
        </AbsoluteFill>
        <Tap x={196} y={330} at={openAt} />
        <Tap x={196} y={366} at={payAt} />
      </Phone>
      <LowerThird time="13:30" label="Carta scaduta" text="Il cliente la aggiorna in un tocco." at={s(1)} />
    </AbsoluteFill>
  );
}

// ─── 17–22 s · 21:08, errore temporaneo della banca ─────────────────────────

function BankScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useSeconds();
  const failIn = spring({ frame: frame - s(0.4), fps, config: { damping: 16 } });
  const lapseStart = s(1.8);
  const lapseEnd = s(3.2);
  // 36 ore di "time-lapse" sull'orologio della lock screen.
  const hours = ease(frame, [lapseStart, lapseEnd], [0, 36]);
  const minutesTotal = (21 * 60 + 8 + Math.round(hours * 60)) % (24 * 60);
  const time = `${Math.floor(minutesTotal / 60)}:${String(minutesTotal % 60).padStart(2, "0")}`;
  const after = frame >= lapseEnd;
  const okIn = spring({ frame: frame - (lapseEnd + 4), fps, config: { damping: 15 } });
  const blur = interpolate(frame, [lapseStart, lapseStart + 6, lapseEnd - 6, lapseEnd], [0, 3, 3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Environment mood={after ? "morning" : "night"} seed="tv-bank" />
      <Phone duration={duration} x={960} y={455} size={0.8} tilt={[-10, -3]} push={[1.02, 1.1]}>
        <div style={{ position: "absolute", inset: 0, filter: `blur(${blur}px)` }}>
          <LockScreen time={time} date={after ? "venerdì 31 ottobre" : "mercoledì 29 ottobre"} wallpaper={after ? WALLPAPERS.morning : WALLPAPERS.dusk}>
            {after && <Notification when="ora" title="Pagamento ricevuto" body="Officine Moretti · €2.100,00 incassati al nuovo tentativo." enter={okIn} />}
            <Notification
              when={after ? "mer" : "ora"}
              title="Pagamento non riuscito"
              body="Officine Moretti · €2.100,00. Errore temporaneo della banca."
              enter={failIn}
              dim={after}
            />
          </LockScreen>
        </div>
      </Phone>
      <LowerThird time="21:08" label="Errore della banca" text="OmniRev riprova da solo dopo 36 ore." at={s(0.6)} />
    </AbsoluteFill>
  );
}

// ─── 22–30 s · Chiusura ─────────────────────────────────────────────────────

const RECOVERED = [
  { who: "Ferramenta Bianchi s.n.c.", amount: "€390,00" },
  { who: "Kairos Gestionale · abbonamento", amount: "€89,00" },
  { who: "Officine Moretti", amount: "€2.100,00" },
];

function EndScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useSeconds();
  const stackOut = ease(frame, [s(2.2), s(2.7)], [0, 1]);
  const draw = ease(frame, [s(2.6), s(3.4)], [0, 1]);
  const node = spring({ frame: frame - s(3.2), fps, config: { damping: 9, stiffness: 180 } });
  const textIn = ease(frame, [s(3.0), s(3.6)], [0, 1]);
  const claimIn = ease(frame, [s(3.6), s(4.2)], [0, 1]);
  const detailsIn = ease(frame, [s(4.3), s(4.9)], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#050506", fontFamily: FONT, color: "#fff", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", width: 760, display: "flex", flexDirection: "column", gap: 14, opacity: 1 - stackOut, filter: `blur(${stackOut * 8}px)` }}>
        {RECOVERED.map((item, index) => {
          const enter = spring({ frame: frame - index * 10, fps, config: { damping: 15, stiffness: 150 } });
          return (
            <div
              key={item.who}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "20px 26px",
                borderRadius: 26,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.12)",
                opacity: enter,
                transform: `translateY(${(1 - enter) * -30}px)`,
              }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 13, background: "linear-gradient(180deg, #6b6b73, #3a3a40)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 600 }}>Pagamento ricevuto</div>
                <div style={{ fontSize: 21, color: "rgba(255,255,255,0.7)" }}>{item.who}</div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{item.amount}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: draw > 0 ? 1 : 0 }}>
        <Wordmark size={120} draw={draw} node={node} textIn={textIn} />
        <div style={{ marginTop: 44, fontSize: 52, fontWeight: 600, letterSpacing: -1.2, opacity: claimIn }}>Recupera da solo i pagamenti falliti.</div>
        <div style={{ marginTop: 18, fontSize: 28, color: "rgba(255,255,255,0.65)", opacity: detailsIn }}>
          Per aziende in abbonamento · Stripe · PayPal · GoCardless · SEPA
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: 1,
            padding: "16px 40px",
            borderRadius: 999,
            border: "1.5px solid rgba(255,255,255,0.35)",
            opacity: detailsIn,
          }}
        >
          omnirev.app
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 64, fontSize: 18, color: "rgba(255,255,255,0.45)", opacity: detailsIn }}>
        Servizio rivolto alle imprese. Nomi e importi a scopo illustrativo.
      </div>
    </AbsoluteFill>
  );
}

// ─── Composizione ───────────────────────────────────────────────────────────

const SCENES = [
  { from: 0, duration: 80, Component: ClockScene },
  { from: 80, duration: 170, Component: SepaScene },
  { from: 250, duration: 175, Component: CardScene },
  { from: 425, duration: 125, Component: BankScene },
  { from: 550, duration: 200, Component: EndScene },
];

export function OmniRevTV() {
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {SCENES.map(({ from, duration, Component }, index) => (
        <Sequence key={from} from={from} durationInFrames={duration}>
          <Cut duration={duration} hold={index === SCENES.length - 1} fade={5}>
            <Component duration={duration} />
          </Cut>
        </Sequence>
      ))}
      <FilmFinish grain={0.06} />
      <TvAudio />
    </AbsoluteFill>
  );
}

/** Colonna sonora (25 fps: 1 s = 25 frame); la base ha il colpo sul finale a 22 s. */
function TvAudio() {
  return (
    <>
      <Music name="tv" volume={0.8} />
      {/* SEPA, notte */}
      <Sfx name="ambience-night" at={80} duration={170} volume={0.45} />
      <Sfx name="ping" at={135} volume={0.25} />
      <Sfx name="whoosh-down" at={185} volume={0.3} />
      <Sfx name="chime" at={205} volume={0.35} />
      {/* Carta scaduta, giorno */}
      <Sfx name="ambience-morning" at={250} duration={175} volume={0.35} />
      <Sfx name="ping" at={265} volume={0.35} />
      <Sfx name="tap" at={295} volume={0.7} />
      <Sfx name="whoosh" at={297} volume={0.2} />
      <Sfx name="tap" at={350} volume={0.7} />
      <Sfx name="chime" at={370} volume={0.4} />
      {/* Errore banca, sera → 36 ore dopo */}
      <Sfx name="buzz" at={435} volume={0.7} />
      <Sfx name="ping" at={436} volume={0.3} />
      <Sfx name="whoosh" at={470} volume={0.35} />
      <Sfx name="ping" at={510} volume={0.35} />
      {/* Chiusura */}
      <Sfx name="ping" at={552} volume={0.2} />
      <Sfx name="ping" at={562} volume={0.2} />
      <Sfx name="ping" at={572} volume={0.2} />
    </>
  );
}
