// Spot pubblicitario OmniRev (15 s, 1920×1080). Racconto in stile
// "real life" su schermi di smartphone, senza riprendere le grafiche del sito:
//   03:12  il rinnovo di un cliente fallisce mentre il merchant dorme;
//   03:12  il cliente riceve un'email a nome del merchant;
//   08:41  il cliente aggiorna la carta dal telefono e il pagamento passa;
//   08:42  il merchant si sveglia con il pagamento già incassato;
//   chiusura con domanda-gancio, logo e dominio.
// Nomi (Nimbus CRM, Studio Rossi) e importi sono di finzione.
// Componenti comuni in ./kit.tsx; audio in src/remotion/assets/audio/.
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";

import {
  BrandMark,
  Cut,
  ease,
  Environment,
  FilmFinish,
  FONT,
  LockScreen,
  Music,
  Notification,
  Phone,
  Sfx,
  StatusBar,
  Tap,
  WALLPAPERS,
} from "./kit";

export const OMNIREV_SPOT = {
  id: "OmniRevSpot",
  fps: 30,
  durationInFrames: 450,
  width: 1920,
  height: 1080,
} as const;


const MERCHANT = "Nimbus CRM";
const CUSTOMER = "Studio Rossi S.r.l.";
const AMOUNT = "€1.490,00";

// ─── Didascalie ─────────────────────────────────────────────────────────────

function Caption({ time, lines, at = 8 }: { time: string; lines: string[]; at?: number }) {
  const frame = useCurrentFrame();
  const timeIn = ease(frame, [at, at + 14], [0, 1]);
  return (
    <div style={{ position: "absolute", left: 180, top: 540, transform: "translateY(-50%)", width: 860, fontFamily: FONT, color: "#fff" }}>
      <div
        style={{
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: 4,
          color: "rgba(255,255,255,0.55)",
          fontVariantNumeric: "tabular-nums",
          opacity: timeIn,
        }}
      >
        {time}
      </div>
      <div style={{ marginTop: 22 }}>
        {lines.map((line, index) => {
          const start = at + 8 + index * 10;
          const opacity = ease(frame, [start, start + 16], [0, 1]);
          const y = ease(frame, [start, start + 16], [24, 0]);
          return (
            <div
              key={line}
              style={{
                fontSize: 64,
                fontWeight: 600,
                letterSpacing: -1.8,
                lineHeight: 1.12,
                opacity,
                transform: `translateY(${y}px)`,
                filter: `blur(${(1 - opacity) * 6}px)`,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scena 1 · 03:12, il pagamento fallisce ─────────────────────────────────

const FAILED_BODY = `${CUSTOMER} · rinnovo annuale ${AMOUNT}. Carta scaduta.`;

function FailureScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = ease(frame, [0, 20], [0, 1]);
  const notifIn = spring({ frame: frame - 22, fps, config: { damping: 16, stiffness: 140 } });
  // Vibrazione all'arrivo della notifica.
  const shake = frame >= 22 && frame < 34 ? Math.sin((frame - 22) * 3.2) * 3 : 0;
  // Lo schermo si spegne a fine scena: nessuno lo sta guardando.
  const screenOff = ease(frame, [duration - 22, duration - 6], [0, 1]);

  return (
    <AbsoluteFill>
      <Environment mood="night" seed="night" />
      <Phone duration={duration} enter={phoneIn} shake={shake} tilt={[-16, -9]}>
        <LockScreen time="3:12" date="martedì 14 ottobre" wallpaper={WALLPAPERS.night}>
          <Notification when="ora" title="Pagamento non riuscito" body={FAILED_BODY} enter={notifIn} />
        </LockScreen>
        <AbsoluteFill style={{ background: "#000", opacity: screenOff * 0.92 }} />
      </Phone>
      <Caption time="03:12" lines={["Il rinnovo di un cliente", "non va a buon fine.", "Tu stai dormendo."]} at={30} />
    </AbsoluteFill>
  );
}

// ─── Scena 2 · 03:12, l'email al cliente ────────────────────────────────────

function InboxRow({
  from,
  subject,
  preview,
  time,
  unread,
  highlight,
}: {
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        padding: "12px 20px 12px 34px",
        borderBottom: "0.5px solid #e5e5ea",
        background: highlight ? "#e5f0ff" : "#fff",
      }}
    >
      {unread && <div style={{ position: "absolute", left: 13, top: 19, width: 10, height: 10, borderRadius: "50%", background: "#0a84ff" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16 }}>
        <span style={{ fontWeight: 700, color: "#000" }}>{from}</span>
        <span style={{ fontSize: 14, color: "#8e8e93" }}>{time}</span>
      </div>
      <div style={{ fontSize: 15, color: "#000", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subject}</div>
      <div style={{ fontSize: 15, color: "#8e8e93", marginTop: 2, lineHeight: 1.3, height: 38, overflow: "hidden" }}>{preview}</div>
    </div>
  );
}

/** Marchio del merchant di finzione: è lui, non OmniRev, a parlare col cliente. */
function MerchantBadge({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "linear-gradient(135deg, #ff7a45, #e8432f)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.55,
        flexShrink: 0,
      }}
    >
      N
    </div>
  );
}

function MerchantLogo({ size = 28 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <MerchantBadge size={size} />
      <span style={{ fontWeight: 700, fontSize: size * 0.62, color: "#111", letterSpacing: -0.3 }}>{MERCHANT}</span>
    </div>
  );
}

const EMAIL_SUBJECT = "La tua carta è scaduta: aggiorna il pagamento";

function EmailScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arrive = spring({ frame: frame - 10, fps, config: { damping: 18 } });
  const openAt = 40;
  const open = ease(frame, [openAt + 2, openAt + 16], [0, 1]);
  const buttonAt = 82;
  const pressed = frame >= buttonAt && frame < buttonAt + 6;

  return (
    <AbsoluteFill>
      <Environment mood="neutral" seed="email" />
      <Phone duration={duration} tilt={[-10, -4]}>
        {/* Inbox */}
        <AbsoluteFill style={{ background: "#fff", transform: `translateX(${-open * 30}%)` }}>
          <StatusBar time="3:12" dark />
          <div style={{ padding: "58px 20px 8px" }}>
            <div style={{ color: "#0a84ff", fontSize: 17 }}>‹ Caselle</div>
            <div style={{ fontSize: 34, fontWeight: 700, color: "#000", marginTop: 8, letterSpacing: -0.5 }}>In arrivo</div>
          </div>
          <div style={{ height: 112 * arrive, overflow: "hidden" }}>
            <div style={{ opacity: arrive }}>
              <InboxRow
                from={MERCHANT}
                subject={EMAIL_SUBJECT}
                preview={`Ciao Laura, il rinnovo di ${MERCHANT} per ${CUSTOMER} non è andato a buon fine…`}
                time="03:12"
                unread
                highlight={frame >= openAt - 2}
              />
            </div>
          </div>
          <InboxRow from="Fatture in Cloud" subject="Fattura n. 2025/418 emessa" preview="La fattura è stata inviata al cliente e registrata…" time="ieri" />
          <InboxRow from="Andrea Conti" subject="Re: preventivo sito" preview="Perfetto, procediamo pure con la seconda opzione. Ti mando…" time="ieri" />
          <InboxRow from="LinkedIn" subject="Hai 3 nuove notifiche" preview="Scopri chi ha visualizzato il tuo profilo questa settimana…" time="lun" />
          <InboxRow from="Aruba" subject="Rinnovo dominio completato" preview="Il rinnovo del dominio studiorossi.it è andato a buon fine…" time="dom" />
        </AbsoluteFill>
        {/* Email aperta */}
        <AbsoluteFill style={{ background: "#fff", transform: `translateX(${(1 - open) * 100}%)`, boxShadow: "-10px 0 30px rgba(0,0,0,0.15)" }}>
          <StatusBar time="3:12" dark />
          <div style={{ padding: "58px 20px 0", color: "#0a84ff", fontSize: 17 }}>‹ In arrivo</div>
          <div style={{ padding: "14px 20px 12px", borderBottom: "0.5px solid #e5e5ea" }}>
            <div style={{ fontSize: 21, fontWeight: 700, color: "#000", lineHeight: 1.25 }}>{EMAIL_SUBJECT}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <MerchantBadge size={36} />
              <div style={{ fontSize: 14 }}>
                <div style={{ fontWeight: 600, color: "#000" }}>{MERCHANT}</div>
                <div style={{ color: "#8e8e93" }}>A: laura@studiorossi.it · 03:12</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "22px 24px", color: "#1c1c1e", fontSize: 16, lineHeight: 1.5 }}>
            <MerchantLogo />
            <p style={{ margin: "20px 0 0" }}>Ciao Laura,</p>
            <p style={{ margin: "10px 0 0" }}>
              il rinnovo annuale di {MERCHANT} per {CUSTOMER} ({AMOUNT}) non è andato a buon fine perché la carta è scaduta.
            </p>
            <p style={{ margin: "10px 0 0" }}>Il tuo account resta attivo: aggiorna il metodo di pagamento in pochi secondi.</p>
            <div
              style={{
                marginTop: 22,
                background: "#e8432f",
                color: "#fff",
                fontWeight: 600,
                textAlign: "center",
                padding: "15px 0",
                borderRadius: 12,
                transform: `scale(${pressed ? 0.97 : 1})`,
                filter: pressed ? "brightness(0.9)" : undefined,
              }}
            >
              Aggiorna metodo di pagamento
            </div>
            <p style={{ margin: "18px 0 0", fontSize: 13, color: "#8e8e93" }}>Il team di {MERCHANT}</p>
          </div>
        </AbsoluteFill>
        <Tap x={200} y={200} at={openAt} />
        <Tap x={196} y={BUTTON_Y} at={buttonAt} />
      </Phone>
      <Caption time="03:12" lines={["Il cliente riceve subito", "un'email. A nome tuo."]} at={20} />
    </AbsoluteFill>
  );
}

/** Altezza (nello schermo) del pulsante dell'email, per posizionare il tocco. */
const BUTTON_Y = 478;

// ─── Scena 3 · 08:41, il cliente aggiorna la carta ──────────────────────────

const NEW_CARD = "4532 8810 2741 8841";

function Field({ label, value, focused, width = "100%" }: { label: string; value: string; focused?: boolean; width?: string }) {
  return (
    <div style={{ width }}>
      <div style={{ fontSize: 13, color: "#6e6e73", marginBottom: 6 }}>{label}</div>
      <div
        style={{
          height: 46,
          borderRadius: 10,
          border: focused ? "2px solid #e8432f" : "1px solid #d2d2d7",
          padding: focused ? "0 13px" : "0 14px",
          display: "flex",
          alignItems: "center",
          fontSize: 16,
          color: "#1c1c1e",
          fontVariantNumeric: "tabular-nums",
          background: "#fff",
          boxSizing: "border-box",
        }}
      >
        {value}
        {focused && <span style={{ width: 1.5, height: 20, background: "#e8432f", marginLeft: 1 }} />}
      </div>
    </div>
  );
}

function PaymentScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typed = Math.floor(ease(frame, [8, 34], [0, NEW_CARD.length]));
  const cardDone = typed >= NEW_CARD.length;
  const expiry = frame >= 38 ? "09/29" : "";
  const cvc = frame >= 44 ? "•••" : "";
  const payAt = 52;
  const paid = payAt + 22;
  const loading = frame >= payAt + 2 && frame < paid;
  const confirmIn = ease(frame, [paid + 6, paid + 14], [0, 1]);
  const check = spring({ frame: frame - (paid + 8), fps, config: { damping: 10, stiffness: 170 } });

  return (
    <AbsoluteFill>
      <Environment mood="morning" seed="pay" />
      <Phone duration={duration} tilt={[-12, -5]}>
        <AbsoluteFill style={{ background: "#f5f5f7" }}>
          <StatusBar time="8:41" dark />
          <div style={{ padding: "70px 22px 0" }}>
            <MerchantLogo size={30} />
            <div style={{ marginTop: 26, fontSize: 25, fontWeight: 700, color: "#1c1c1e", letterSpacing: -0.4 }}>Aggiorna il metodo di pagamento</div>
            <div
              style={{
                marginTop: 16,
                padding: "14px 16px",
                borderRadius: 12,
                background: "#fff",
                border: "1px solid #e5e5ea",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 15,
                color: "#1c1c1e",
              }}
            >
              <span>
                Rinnovo annuale
                <br />
                <span style={{ color: "#6e6e73", fontSize: 13 }}>{CUSTOMER}</span>
              </span>
              <span style={{ fontWeight: 700, fontSize: 18 }}>{AMOUNT}</span>
            </div>
            <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Numero carta" value={NEW_CARD.slice(0, typed)} focused={!cardDone} />
              <div style={{ display: "flex", gap: 12 }}>
                <Field label="Scadenza" value={expiry} focused={cardDone && !expiry} width="50%" />
                <Field label="CVC" value={cvc} focused={!!expiry && !cvc} width="50%" />
              </div>
            </div>
            <div
              style={{
                marginTop: 24,
                height: 52,
                borderRadius: 12,
                background: frame >= paid ? "#1f9d55" : "#e8432f",
                color: "#fff",
                fontWeight: 600,
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${frame >= payAt && frame < payAt + 5 ? 0.97 : 1})`,
              }}
            >
              {loading ? (
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: "2.5px solid rgba(255,255,255,0.35)",
                    borderTopColor: "#fff",
                    boxSizing: "border-box",
                    transform: `rotate(${frame * 18}deg)`,
                  }}
                />
              ) : frame >= paid ? (
                "Pagamento completato"
              ) : (
                `Aggiorna e paga ${AMOUNT}`
              )}
            </div>
          </div>
          {/* Barra dell'indirizzo del browser */}
          <div
            style={{
              position: "absolute",
              bottom: 26,
              left: 16,
              right: 16,
              height: 46,
              borderRadius: 14,
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 15,
              color: "#1c1c1e",
            }}
          >
            <svg width={11} height={13} viewBox="0 0 11 13" fill="#1c1c1e">
              <path d="M2 5.5V4a3.5 3.5 0 0 1 7 0v1.5h.5A1.5 1.5 0 0 1 11 7v4.5A1.5 1.5 0 0 1 9.5 13h-8A1.5 1.5 0 0 1 0 11.5V7a1.5 1.5 0 0 1 1.5-1.5H2Zm1.5 0h4V4a2 2 0 0 0-4 0v1.5Z" />
            </svg>
            omnirev.app
          </div>
          {/* Conferma */}
          {confirmIn > 0 && (
            <AbsoluteFill style={{ background: "#f5f5f7", opacity: confirmIn, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  background: "#1f9d55",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${check})`,
                }}
              >
                <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div style={{ marginTop: 22, fontSize: 24, fontWeight: 700, color: "#1c1c1e" }}>Pagamento completato</div>
              <div style={{ marginTop: 8, fontSize: 15, color: "#6e6e73", lineHeight: 1.5 }}>
                {AMOUNT} · Visa •••• 8841
                <br />
                Grazie, Laura!
              </div>
            </AbsoluteFill>
          )}
        </AbsoluteFill>
        <Tap x={196} y={PAY_BUTTON_Y} at={payAt} />
      </Phone>
      <Caption time="08:41" lines={["Lo aggiorna dal telefono", "in dieci secondi."]} at={10} />
    </AbsoluteFill>
  );
}

/** Altezza (nello schermo) del pulsante di pagamento, per posizionare il tocco. */
const PAY_BUTTON_Y = 482;

// ─── Scena 4 · 08:42, il merchant si sveglia ────────────────────────────────

function MorningScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = ease(frame, [0, 14], [0, 1]);
  const wake = ease(frame, [4, 16], [0, 1]);
  const recovered = spring({ frame: frame - 18, fps, config: { damping: 15, stiffness: 140 } });

  return (
    <AbsoluteFill>
      <Environment mood="morning" seed="morning" />
      <Phone duration={duration} enter={phoneIn} tilt={[-8, -3]} push={[1.02, 1.1]}>
        <LockScreen time="8:42" date="martedì 14 ottobre" wallpaper={WALLPAPERS.morning}>
          <Notification
            when="ora"
            title="Pagamento ricevuto"
            body={`${CUSTOMER} · rinnovo annuale ${AMOUNT} incassato.`}
            enter={recovered}
          />
          <Notification when="03:12" title="Pagamento non riuscito" body={FAILED_BODY} enter={1} dim />
        </LockScreen>
        <AbsoluteFill style={{ background: "#000", opacity: 1 - wake }} />
      </Phone>
      <Caption time="08:42" lines={["Ti svegli.", "È già tutto risolto."]} at={14} />
    </AbsoluteFill>
  );
}

// ─── Scena 5 · chiusura ─────────────────────────────────────────────────────

function EndScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const questionIn = ease(frame, [0, 14], [0, 1]);
  const questionOut = ease(frame, [34, 42], [0, 1]);
  const draw = ease(frame, [40, 62], [0, 1]);
  const node = spring({ frame: frame - 56, fps, config: { damping: 9, stiffness: 180 } });
  const wordmarkIn = ease(frame, [50, 64], [0, 1]);
  const lineIn = ease(frame, [60, 74], [0, 1]);
  const urlIn = ease(frame, [68, 80], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#050505", fontFamily: FONT, color: "#fff", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          fontSize: 76,
          fontWeight: 600,
          letterSpacing: -2,
          lineHeight: 1.15,
          textAlign: "center",
          opacity: questionIn * (1 - questionOut),
          filter: `blur(${questionOut * 10}px)`,
          transform: `scale(${1 + questionOut * 0.04})`,
        }}
      >
        Quanti pagamenti hai perso
        <br />
        <span style={{ color: "rgba(255,255,255,0.55)" }}>questo mese?</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: draw > 0 ? 1 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
          <BrandMark size={112} draw={draw} node={node} />
          <span
            style={{
              fontSize: 92,
              fontWeight: 600,
              letterSpacing: "-0.035em",
              opacity: wordmarkIn,
              transform: `translateX(${(1 - wordmarkIn) * -20}px)`,
            }}
          >
            Omni<span style={{ color: "rgba(255,255,255,0.7)" }}>Rev</span>
          </span>
        </div>
        <div style={{ marginTop: 40, fontSize: 40, fontWeight: 500, color: "rgba(255,255,255,0.75)", letterSpacing: -0.6, opacity: lineIn }}>
          Recupera da solo i pagamenti falliti del tuo SaaS.
        </div>
        <div
          style={{
            marginTop: 34,
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: 1,
            color: "#fff",
            padding: "14px 30px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.3)",
            opacity: urlIn,
          }}
        >
          omnirev.app
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Composizione ───────────────────────────────────────────────────────────

const SCENES = [
  { from: 0, duration: 90, Component: FailureScene },
  { from: 90, duration: 108, Component: EmailScene },
  { from: 198, duration: 102, Component: PaymentScene },
  { from: 300, duration: 66, Component: MorningScene },
  { from: 366, duration: 84, Component: EndScene },
];

export function OmniRevSpot() {
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {SCENES.map(({ from, duration, Component }, index) => (
        <Sequence key={from} from={from} durationInFrames={duration}>
          <Cut duration={duration} hold={index === SCENES.length - 1}>
            <Component duration={duration} />
          </Cut>
        </Sequence>
      ))}
      <FilmFinish />
      <SpotAudio />
    </AbsoluteFill>
  );
}

/** Colonna sonora: base al piano (scripts/generate-spot-audio.mjs) ed effetti sincronizzati alle scene. */
function SpotAudio() {
  return (
    <>
      <Music name="spot" volume={0.75} />
      {/* Notte: ambiente, vibrazione e notifica del pagamento fallito. */}
      <Sfx name="ambience-night" at={0} duration={90} volume={0.6} />
      <Sfx name="buzz" at={22} volume={0.8} />
      <Sfx name="ping" at={23} volume={0.35} />
      {/* Email: arrivo, apertura, tocco sul pulsante. */}
      <Sfx name="ping" at={100} volume={0.3} />
      <Sfx name="tap" at={130} volume={0.7} />
      <Sfx name="whoosh" at={131} volume={0.2} />
      <Sfx name="tap" at={172} volume={0.7} />
      {/* Pagamento: digitazione, tocco, conferma. */}
      <Sfx name="typing-soft" at={206} duration={40} volume={0.6} />
      <Sfx name="tap" at={250} volume={0.7} />
      <Sfx name="chime" at={272} volume={0.45} />
      {/* Mattina: cinguettii e notifica del pagamento ricevuto. */}
      <Sfx name="ambience-morning" at={300} duration={66} volume={0.6} />
      <Sfx name="ping" at={318} volume={0.35} />
    </>
  );
}
