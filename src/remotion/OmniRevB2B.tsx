// Video di presentazione per aziende (70 s, 1920×1080, 30 fps), da usare in
// call commerciali, fiere o sul sito. Capitoli:
//   0–6 s    apertura
//   6–16 s   01 · il problema
//   16–46 s  02 · come funziona (collegamento, classificazione, strategia, recupero)
//   46–58 s  03 · perché fidarsi
//   58–70 s  chiusura e invito all'azione
// Ogni affermazione corrisponde a una funzione esistente: integrazioni
// Stripe/PayPal/GoCardless/SEPA, categorie di src/lib/dunning-error-categorization.ts,
// dati carta via Stripe SetupIntent (src/app/pay/[token]), webhook firmati e
// idempotenti (src/lib/webhook-idempotency.ts), email col marchio del merchant,
// DPA (src/app/dpa). Nomi e importi di finzione.
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import type { ReactNode } from "react";
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { Cut, ease, Environment, FilmFinish, FONT, Laptop, MerchantBadge, Music, Phone, Sfx, StatusBar, Tap, Wordmark } from "./kit";

const { fontFamily: MONO } = loadMono("normal", { weights: ["500"], subsets: ["latin"] });

export const OMNIREV_B2B = {
  id: "OmniRevB2B",
  fps: 30,
  durationInFrames: 2100,
  width: 1920,
  height: 1080,
} as const;

// ─── Elementi di regia ──────────────────────────────────────────────────────

function Chapter({ number, title }: { number: string; title: string }) {
  const frame = useCurrentFrame();
  const inOp = ease(frame, [0, 14], [0, 1]);
  return (
    <div style={{ position: "absolute", left: 120, top: 84, display: "flex", alignItems: "center", gap: 18, fontFamily: FONT, color: "#fff", opacity: inOp }}>
      <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 3, color: "#6ee7b7" }}>{number}</span>
      <span style={{ width: 40 * inOp, height: 2, background: "rgba(255,255,255,0.5)" }} />
      <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.8)" }}>{title}</span>
    </div>
  );
}

function Headline({ children, at = 6, top = 150, width = 760 }: { children: ReactNode; at?: number; top?: number; width?: number }) {
  const frame = useCurrentFrame();
  const inOp = ease(frame, [at, at + 16], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        top,
        width,
        fontFamily: FONT,
        color: "#fff",
        fontSize: 60,
        fontWeight: 600,
        lineHeight: 1.1,
        letterSpacing: -1.5,
        opacity: inOp,
        transform: `translateY(${(1 - inOp) * 20}px)`,
      }}
    >
      {children}
    </div>
  );
}

function Body({ children, at = 16, top = 420, width = 640 }: { children: ReactNode; at?: number; top?: number; width?: number }) {
  const frame = useCurrentFrame();
  const inOp = ease(frame, [at, at + 16], [0, 1]);
  return (
    <div style={{ position: "absolute", left: 120, top, width, fontFamily: FONT, color: "rgba(255,255,255,0.72)", fontSize: 30, lineHeight: 1.45, opacity: inOp }}>
      {children}
    </div>
  );
}

function Step({ index, label }: { index: number; label: string }) {
  const frame = useCurrentFrame();
  const inOp = ease(frame, [0, 12], [0, 1]);
  return (
    <div style={{ position: "absolute", left: 120, bottom: 96, display: "flex", gap: 14, alignItems: "center", fontFamily: FONT, opacity: inOp }}>
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          style={{
            width: n === index ? 56 : 14,
            height: 14,
            borderRadius: 7,
            background: n === index ? "#10B981" : n < index ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.25)",
          }}
        />
      ))}
      <span style={{ marginLeft: 12, fontSize: 22, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
        Passo {index} di 4 · {label}
      </span>
    </div>
  );
}

// ─── 0–6 s · Apertura ───────────────────────────────────────────────────────

function ColdOpen() {
  const frame = useCurrentFrame();
  const l1 = ease(frame, [10, 30], [0, 1]);
  const l2 = ease(frame, [70, 90], [0, 1]);
  return (
    <AbsoluteFill>
      <Environment mood="office" seed="b2b-open" />
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.45)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: FONT, color: "#fff" }}>
        <div style={{ fontSize: 68, fontWeight: 600, letterSpacing: -1.6, opacity: l1, transform: `translateY(${(1 - l1) * 20}px)` }}>
          Ogni azienda in abbonamento
          <br />
          ha un problema che non si vede.
        </div>
        <div style={{ marginTop: 40, fontSize: 36, color: "rgba(255,255,255,0.7)", opacity: l2 }}>
          Clienti che se ne vanno senza averlo deciso.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ─── 6–16 s · 01 Il problema ────────────────────────────────────────────────

const FAILED = [
  { name: "Nordic Fitness Club", reason: "Carta scaduta", amount: "€149,00", age: "2 g" },
  { name: "Studio Medico Associato", reason: "Fondi insufficienti", amount: "€420,00", age: "5 g" },
  { name: "Gruppo Ottico Visus", reason: "Errore della banca", amount: "€1.180,00", age: "1 g" },
  { name: "Cantina Valtellina", reason: "Carta rifiutata", amount: "€260,00", age: "9 g" },
  { name: "Scuola di Lingue Babel", reason: "Carta scaduta", amount: "€89,00", age: "14 g" },
  { name: "Logistica Adriatica", reason: "Fondi insufficienti", amount: "€2.400,00", age: "3 g" },
  { name: "Farmacia San Marco", reason: "Carta scaduta", amount: "€199,00", age: "21 g" },
];

function GatewayHeader({ title, merchant = "Fiscalis" }: { title: string; merchant?: string }) {
  return (
    <div style={{ height: 64, background: "#fff", borderBottom: "1px solid #e6e6e9", display: "flex", alignItems: "center", padding: "0 36px", gap: 14 }}>
      <MerchantBadge size={30} letter={merchant[0]} colors={["#3b82f6", "#1e40af"]} />
      <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>{merchant}</span>
      <span style={{ fontSize: 17, color: "#6b6b73", marginLeft: 22 }}>{title}</span>
    </div>
  );
}

function ProblemScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Environment mood="office" seed="b2b-problem" />
      <Laptop duration={duration} x={1290} y={580} size={0.74} tilt={[-14, -8]}>
        <AbsoluteFill style={{ background: "#f7f7f8", color: "#1d1d1f" }}>
          <GatewayHeader title="Pagamenti non riusciti · ultimi 30 giorni" />
          <div style={{ padding: "28px 36px" }}>
            <div style={{ display: "flex", gap: 18 }}>
              {[
                ["Da incassare", "€4.697,00", "#b42318"],
                ["Clienti coinvolti", "7", "#1d1d1f"],
                ["Solleciti inviati", "0", "#b54708"],
              ].map(([label, value, color]) => (
                <div key={label} style={{ flex: 1, background: "#fff", border: "1px solid #e6e6e9", borderRadius: 14, padding: "18px 22px" }}>
                  <div style={{ fontSize: 16, color: "#6b6b73" }}>{label}</div>
                  <div style={{ fontSize: 34, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 22, background: "#fff", borderRadius: 14, border: "1px solid #e6e6e9", overflow: "hidden" }}>
              {FAILED.map((row, index) => {
                const show = ease(frame, [10 + index * 6, 20 + index * 6], [0, 1]);
                return (
                  <div
                    key={row.name}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 260px 160px 90px",
                      padding: "16px 24px",
                      fontSize: 18,
                      borderBottom: "1px solid #f0f0f2",
                      opacity: show,
                      transform: `translateX(${(1 - show) * 20}px)`,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{row.name}</span>
                    <span style={{ color: "#b42318" }}>{row.reason}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{row.amount}</span>
                    <span style={{ color: "#8a8a92" }}>{row.age}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </AbsoluteFill>
      </Laptop>
      <Chapter number="01" title="Il problema" />
      <Headline width={620}>
        Il cliente non ha disdetto.
        <br />
        <span style={{ color: "#fca5a5" }}>Il pagamento è fallito.</span>
      </Headline>
      <Body at={40} top={380} width={600}>
        Carte scadute, fondi insufficienti, errori della banca. Se nessuno interviene in tempo, l’abbonamento si chiude e il cliente è perso.
      </Body>
    </AbsoluteFill>
  );
}

// ─── 16–46 s · 02 Come funziona ─────────────────────────────────────────────

const GATEWAYS = [
  { name: "Stripe", detail: "Carte e abbonamenti", at: 40 },
  { name: "PayPal", detail: "Abbonamenti PayPal", at: 62 },
  { name: "GoCardless", detail: "Addebiti diretti", at: 84 },
  { name: "SEPA SDD", detail: "Addebito diretto via API", at: 106 },
];

function ConnectStep({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Environment mood="office" seed="b2b-connect" />
      <Laptop duration={duration} x={1290} y={580} size={0.74} tilt={[-12, -7]}>
        <AbsoluteFill style={{ background: "#f7f7f8", color: "#1d1d1f", padding: "56px 64px" }}>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>Collega i tuoi sistemi di incasso</div>
          <div style={{ fontSize: 19, color: "#6b6b73", marginTop: 8 }}>Accesso autorizzato dal tuo account. Puoi scollegarlo quando vuoi.</div>
          <div style={{ marginTop: 36, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
            {GATEWAYS.map((gateway) => {
              const connected = frame >= gateway.at;
              const pop = ease(frame, [gateway.at, gateway.at + 8], [0, 1]);
              return (
                <div
                  key={gateway.name}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: `1.5px solid ${connected ? "#86efac" : "#e6e6e9"}`,
                    padding: "26px 28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 700 }}>{gateway.name}</div>
                    <div style={{ fontSize: 17, color: "#6b6b73", marginTop: 4 }}>{gateway.detail}</div>
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      padding: "10px 18px",
                      borderRadius: 10,
                      background: connected ? "#e7f6ec" : "#111",
                      color: connected ? "#1a7f3c" : "#fff",
                      transform: `scale(${connected ? 0.92 + pop * 0.08 : 1})`,
                    }}
                  >
                    {connected ? "✓ Collegato" : "Collega"}
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </Laptop>
      <Chapter number="02" title="Come funziona" />
      <Headline width={620}>Colleghi i tuoi incassi. Una volta.</Headline>
      <Body at={30} top={330} width={580}>
        OmniRev riceve in tempo reale ogni pagamento non riuscito da Stripe, PayPal, GoCardless e addebiti SEPA.
      </Body>
      <Step index={1} label="Collegamento" />
    </AbsoluteFill>
  );
}

const EVENTS = [
  { time: "09:14:02", source: "stripe", code: "expired_card", category: "Carta scaduta", action: "Email con link sicuro, subito" },
  { time: "09:31:47", source: "gocardless", code: "insufficient_funds", category: "Fondi insufficienti", action: "Nuovo tentativo il 15, ore 09:00" },
  { time: "10:02:19", source: "sdd", code: "MS03", category: "Errore della banca", action: "Nuovo tentativo tra 36 ore" },
  { time: "10:45:55", source: "stripe", code: "do_not_honor", category: "Carta rifiutata", action: "Email con link sicuro, subito" },
];

function ClassifyStep({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Environment mood="night" seed="b2b-classify" />
      <Laptop duration={duration} x={1290} y={580} size={0.74} tilt={[-12, -7]}>
        <AbsoluteFill style={{ background: "#0d1117", color: "#c9d1d9", fontFamily: MONO, padding: "40px 44px", fontSize: 19 }}>
          <div style={{ color: "#8b949e", marginBottom: 22 }}>Eventi in arrivo · classificazione automatica</div>
          {EVENTS.map((event, index) => {
            const at = 14 + index * 34;
            const show = ease(frame, [at, at + 8], [0, 1]);
            const classified = ease(frame, [at + 14, at + 22], [0, 1]);
            return (
              <div key={event.time} style={{ marginBottom: 26, opacity: show }}>
                <div>
                  <span style={{ color: "#8b949e" }}>{event.time}</span>
                  <span style={{ color: "#79c0ff", marginLeft: 18 }}>{event.source.padEnd(11, " ")}</span>
                  <span style={{ marginLeft: 6 }}>payment_failed</span>
                  <span style={{ color: "#ffa198", marginLeft: 18 }}>{event.code}</span>
                </div>
                <div style={{ marginTop: 10, marginLeft: 120, display: "flex", gap: 14, alignItems: "center", opacity: classified, fontFamily: FONT, fontSize: 19 }}>
                  <span style={{ color: "#6ee7b7" }}>→</span>
                  <span style={{ padding: "4px 12px", borderRadius: 8, background: "rgba(110,231,183,0.12)", color: "#6ee7b7", fontWeight: 600 }}>{event.category}</span>
                  <span style={{ color: "#c9d1d9" }}>{event.action}</span>
                </div>
              </div>
            );
          })}
        </AbsoluteFill>
      </Laptop>
      <Chapter number="02" title="Come funziona" />
      <Headline width={620}>Capisce perché il pagamento è fallito.</Headline>
      <Body at={30} top={330} width={580}>
        Ogni codice di rifiuto del gateway viene classificato. La causa decide cosa fare: niente tentativi alla cieca.
      </Body>
      <Step index={2} label="Classificazione" />
    </AbsoluteFill>
  );
}

const STRATEGIES = [
  { cause: "Carta scaduta o rifiutata", action: "Email al cliente con link sicuro per aggiornare la carta", when: "Subito", color: "#fca5a5" },
  { cause: "Fondi insufficienti", action: "Nuovo addebito nel giorno di accredito stipendi", when: "1° o 15 del mese", color: "#fcd34d" },
  { cause: "Errore temporaneo della banca", action: "Nuovo addebito automatico", when: "Dopo 36 ore", color: "#93c5fd" },
];

function StrategyStep() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Environment mood="night" seed="b2b-strategy" />
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.35)" }} />
      <Chapter number="02" title="Come funziona" />
      <Headline width={1400}>Per ogni causa, la strategia giusta.</Headline>
      <div style={{ position: "absolute", left: 120, right: 120, top: 340, display: "flex", flexDirection: "column", gap: 30, fontFamily: FONT }}>
        {STRATEGIES.map((strategy, index) => {
          const at = 18 + index * 26;
          const causeIn = ease(frame, [at, at + 10], [0, 1]);
          const line = ease(frame, [at + 8, at + 24], [0, 1]);
          const actionIn = ease(frame, [at + 20, at + 32], [0, 1]);
          return (
            <div key={strategy.cause} style={{ display: "flex", alignItems: "center", height: 130 }}>
              <div
                style={{
                  width: 470,
                  padding: "26px 30px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.06)",
                  border: `1.5px solid ${strategy.color}`,
                  color: "#fff",
                  fontSize: 30,
                  fontWeight: 600,
                  opacity: causeIn,
                }}
              >
                {strategy.cause}
              </div>
              <div style={{ flex: 1, position: "relative", height: 2, margin: "0 26px" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: 2, width: `${line * 100}%`, background: "rgba(255,255,255,0.6)" }} />
                <div
                  style={{
                    position: "absolute",
                    left: `calc(${line * 100}% - 8px)`,
                    top: -7,
                    width: 0,
                    height: 0,
                    borderTop: "8px solid transparent",
                    borderBottom: "8px solid transparent",
                    borderLeft: "12px solid rgba(255,255,255,0.8)",
                    opacity: line,
                  }}
                />
              </div>
              <div
                style={{
                  width: 700,
                  padding: "22px 30px",
                  borderRadius: 18,
                  background: "#fff",
                  color: "#111",
                  opacity: actionIn,
                  transform: `translateX(${(1 - actionIn) * 30}px)`,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#0f766e" }}>{strategy.when}</div>
                <div style={{ fontSize: 28, fontWeight: 600, marginTop: 6, lineHeight: 1.25 }}>{strategy.action}</div>
              </div>
            </div>
          );
        })}
      </div>
      <Step index={3} label="Strategia" />
    </AbsoluteFill>
  );
}

function RecoverStep({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const payAt = 70;
  const doneAt = 92;
  const done = spring({ frame: frame - doneAt, fps, config: { damping: 11, stiffness: 160 } });
  const autofill = ease(frame, [30, 50], [0, 1]);

  return (
    <AbsoluteFill>
      <Environment mood="morning" seed="b2b-recover" />
      <Phone duration={duration} x={1440} y={520} size={0.86} tilt={[-14, -6]}>
        <AbsoluteFill style={{ background: "#f5f5f7", color: "#1c1c1e" }}>
          <StatusBar time="9:16" dark />
          <div style={{ padding: "70px 22px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MerchantBadge size={30} letter="F" colors={["#3b82f6", "#1e40af"]} />
              <span style={{ fontWeight: 700, fontSize: 19 }}>Fiscalis</span>
            </div>
            <div style={{ marginTop: 24, fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>Aggiorna il metodo di pagamento</div>
            <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1px solid #e5e5ea", display: "flex", justifyContent: "space-between", fontSize: 15 }}>
              <span>
                Nordic Fitness Club
                <br />
                <span style={{ color: "#6e6e73", fontSize: 13 }}>Abbonamento mensile</span>
              </span>
              <span style={{ fontWeight: 700 }}>€149,00</span>
            </div>
            <div style={{ marginTop: 18, fontSize: 13, color: "#6e6e73" }}>Nuova carta</div>
            <div style={{ marginTop: 6, height: 48, borderRadius: 10, border: "1px solid #d2d2d7", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", fontSize: 16 }}>
              <span style={{ opacity: autofill }}>•••• •••• •••• 7781</span>
              <span style={{ opacity: autofill, color: "#6e6e73" }}>04/31</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#8e8e93" }}>🔒 Dati della carta gestiti da Stripe</div>
            <div
              style={{
                marginTop: 18,
                height: 52,
                borderRadius: 12,
                background: frame >= doneAt ? "#1f9d55" : "#1d4ed8",
                color: "#fff",
                fontWeight: 600,
                fontSize: 17,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {frame >= doneAt ? "✓ Pagamento completato" : frame >= payAt ? "Attendere…" : "Aggiorna e paga €149,00"}
            </div>
            <div style={{ marginTop: 26, textAlign: "center", fontSize: 15, color: "#6e6e73", opacity: done }}>Grazie! Il tuo abbonamento resta attivo.</div>
          </div>
        </AbsoluteFill>
        <Tap x={196} y={424} at={payAt} />
      </Phone>
      <Chapter number="02" title="Come funziona" />
      <Headline width={760}>
        Il cliente paga in un tocco.
        <br />
        <span style={{ color: "#6ee7b7" }}>Tu ritrovi l’incasso.</span>
      </Headline>
      <Body at={36} top={380} width={680}>
        L’email porta il tuo nome e il tuo logo, il link apre una pagina di pagamento sicura. Quando il pagamento passa, la sequenza si ferma da sola.
      </Body>
      <Step index={4} label="Recupero" />
    </AbsoluteFill>
  );
}

// ─── 46–58 s · 03 Fiducia ───────────────────────────────────────────────────

const TRUST = [
  { title: "Dati carta su Stripe", text: "Il cliente inserisce la carta in un modulo Stripe: i numeri non passano da OmniRev." },
  { title: "Il tuo marchio", text: "Email e pagina di pagamento con il tuo nome, il tuo logo e i tuoi testi." },
  { title: "Eventi verificati", text: "Webhook con firma verificata e gestiti una sola volta: niente doppi addebiti o doppie email." },
  { title: "GDPR", text: "Accordo sul trattamento dei dati (DPA) disponibile per ogni cliente." },
];

function TrustScene() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Environment mood="neutral" seed="b2b-trust" />
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.4)" }} />
      <Chapter number="03" title="Perché fidarsi" />
      <Headline width={1400}>Costruito per i dati di pagamento.</Headline>
      <div style={{ position: "absolute", left: 120, right: 120, top: 340, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, fontFamily: FONT }}>
        {TRUST.map((item, index) => {
          const inOp = ease(frame, [24 + index * 18, 40 + index * 18], [0, 1]);
          return (
            <div
              key={item.title}
              style={{
                padding: "34px 38px",
                borderRadius: 22,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                opacity: inOp,
                transform: `translateY(${(1 - inOp) * 24}px)`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 17, background: "rgba(16,185,129,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>{item.title}</div>
              </div>
              <div style={{ marginTop: 14, fontSize: 25, lineHeight: 1.4, color: "rgba(255,255,255,0.72)" }}>{item.text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ─── 58–70 s · Chiusura ─────────────────────────────────────────────────────

function ClosingScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // La base ha il colpo a 61.1 s, cioè 93 frame dopo l'inizio della scena.
  const hit = 93;
  const preIn = ease(frame, [6, 24], [0, 1]);
  const preOut = ease(frame, [hit - 14, hit - 2], [0, 1]);
  const draw = ease(frame, [hit - 4, hit + 18], [0, 1]);
  const node = spring({ frame: frame - (hit + 12), fps, config: { damping: 9, stiffness: 180 } });
  const textIn = ease(frame, [hit + 8, hit + 22], [0, 1]);
  const ctaIn = ease(frame, [hit + 26, hit + 42], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#050506", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "#fff" }}>
      <div style={{ position: "absolute", fontSize: 64, fontWeight: 600, letterSpacing: -1.5, textAlign: "center", opacity: preIn * (1 - preOut) }}>
        Attivazione in pochi minuti.
        <br />
        <span style={{ color: "rgba(255,255,255,0.6)" }}>Nessuna modifica al tuo sistema di fatturazione.</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: draw > 0 ? 1 : 0 }}>
        <Wordmark size={130} draw={draw} node={node} textIn={textIn} />
        <div style={{ marginTop: 46, fontSize: 48, fontWeight: 600, letterSpacing: -1, opacity: textIn }}>Recupera da solo i pagamenti falliti.</div>
        <div style={{ marginTop: 50, display: "flex", gap: 22, opacity: ctaIn, transform: `translateY(${(1 - ctaIn) * 16}px)` }}>
          <div style={{ padding: "20px 40px", borderRadius: 999, background: "#fff", color: "#000", fontSize: 32, fontWeight: 700 }}>Inizia la beta gratuita</div>
          <div style={{ padding: "20px 40px", borderRadius: 999, border: "1.5px solid rgba(255,255,255,0.35)", fontSize: 32, fontWeight: 600 }}>omnirev.app</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Composizione ───────────────────────────────────────────────────────────

const SCENES: { from: number; duration: number; render: (duration: number) => ReactNode }[] = [
  { from: 0, duration: 180, render: () => <ColdOpen /> },
  { from: 180, duration: 300, render: (d) => <ProblemScene duration={d} /> },
  { from: 480, duration: 225, render: (d) => <ConnectStep duration={d} /> },
  { from: 705, duration: 225, render: (d) => <ClassifyStep duration={d} /> },
  { from: 930, duration: 225, render: () => <StrategyStep /> },
  { from: 1155, duration: 225, render: (d) => <RecoverStep duration={d} /> },
  { from: 1380, duration: 360, render: () => <TrustScene /> },
  { from: 1740, duration: 360, render: () => <ClosingScene /> },
];

export function OmniRevB2B() {
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {SCENES.map(({ from, duration, render }, index) => (
        <Sequence key={from} from={from} durationInFrames={duration}>
          <Cut duration={duration} hold={index === SCENES.length - 1} fade={8}>
            {render(duration)}
          </Cut>
        </Sequence>
      ))}
      <FilmFinish grain={0.05} vignette={0.5} />
      <B2bAudio />
    </AbsoluteFill>
  );
}

function B2bAudio() {
  const typingAt = (index: number) => 705 + 14 + index * 34;
  return (
    <>
      <Music name="b2b" volume={0.7} fadeOutFrames={45} />
      {/* Cambi di passo dentro "Come funziona"; i cambi di capitolo (6, 16, 46, 58 s) hanno il fruscio nella base. */}
      <Sfx name="whoosh" at={700} volume={0.25} />
      <Sfx name="whoosh" at={925} volume={0.25} />
      <Sfx name="whoosh" at={1150} volume={0.25} />
      {GATEWAYS.map((gateway) => (
        <Sfx key={gateway.name} name="tick" at={480 + gateway.at} volume={0.45} />
      ))}
      {EVENTS.map((event, index) => (
        <Sfx key={event.time} name="typing-soft" at={typingAt(index)} duration={14} volume={0.3} />
      ))}
      <Sfx name="tap" at={1155 + 70} volume={0.7} />
      <Sfx name="chime" at={1155 + 92} volume={0.35} />
    </>
  );
}
