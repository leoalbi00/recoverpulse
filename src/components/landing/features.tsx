import { BarChart3, Check, EyeOff, LayoutGrid, RotateCw, ShieldCheck } from "lucide-react";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { SectionHeading } from "@/components/landing/section-heading";

// Tempi reali del cron di riaddebito (src/app/api/cron/smart-retry/route.ts):
// primo tentativo a +12h, poi backoff a +24h e +48h, massimo 3 tentativi.
const RETRY_TIMELINE = [
  { label: "Rifiuto", tone: "failed" },
  { label: "+12h", tone: "pending" },
  { label: "+24h", tone: "pending" },
  { label: "Recuperato", tone: "done" },
] as const;

const TIMELINE_TONES = {
  failed: "border-red-200 bg-red-50 text-red-700",
  pending: "border-border text-muted-foreground",
  done: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

// Gli slot obbligatori validati da src/lib/guardrails.ts.
const PAYMENT_SLOTS = ["customerId", "invoiceId", "amount", "currency"];

const ANALYTICS_BARS = [38, 52, 45, 61, 58, 72, 66, 80, 74, 88, 83, 96];

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-24 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 md:gap-16">
        <SectionHeading
          id="features-title"
          eyebrow="Funzionalità"
          icon={LayoutGrid}
          title="Un motore di recupero progettato come un sistema finanziario"
          description="Ogni azione sul denaro dei tuoi clienti passa da controlli espliciti, tracciati e ripetibili."
        />

        <BentoGrid>
          <BentoCard
            icon={<RotateCw />}
            title="Smart Retry"
            description="Il riaddebito riparte da solo con backoff progressivo, mentre il cliente riceve il link per aggiornare la carta. Dopo il terzo tentativo subentra la sequenza di solleciti."
            className="md:col-span-2"
          >
            <ol className="flex flex-wrap items-center gap-2">
              {RETRY_TIMELINE.map((step, index) => (
                <li key={step.label} className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 font-mono text-xs tabular-nums ${TIMELINE_TONES[step.tone]}`}
                  >
                    {step.label}
                  </span>
                  {index < RETRY_TIMELINE.length - 1 && <span aria-hidden className="h-px w-4 bg-stone-300" />}
                </li>
              ))}
            </ol>
          </BentoCard>

          <BentoCard
            icon={<ShieldCheck />}
            title="Stop-Slot Guardrails"
            description="Nessun addebito né sollecito parte se manca anche uno solo dei dati obbligatori."
          >
            <ul className="grid grid-cols-2 gap-2">
              {PAYMENT_SLOTS.map((slot) => (
                <li
                  key={slot}
                  className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 font-mono text-[11px] text-foreground"
                >
                  <Check className="size-3 shrink-0 text-emerald-700" />
                  {slot}
                </li>
              ))}
            </ul>
          </BentoCard>

          <BentoCard
            icon={<EyeOff />}
            title="Anonymization Engine"
            tag="In arrivo"
            description="I dati personali dei tuoi clienti vengono pseudonimizzati prima di qualsiasi elaborazione da parte dei modelli AI."
          >
            <div className="flex flex-col gap-1.5 rounded-md border border-border px-3 py-2 font-mono text-[11px]">
              <span className="truncate text-stone-500 line-through decoration-stone-400">mario.rossi@acme.it</span>
              <span className="truncate text-emerald-800">customer_7f3a…@redacted</span>
            </div>
          </BentoCard>

          <BentoCard
            icon={<BarChart3 />}
            title="Analytics in tempo reale"
            description="Fatturato recuperato, tasso di recupero e pagamenti in corso, aggiornati via webhook dai tuoi gateway."
            className="md:col-span-2"
          >
            <div aria-hidden className="flex h-16 items-end gap-1.5">
              {ANALYTICS_BARS.map((height, index) => (
                <span
                  key={index}
                  className={`flex-1 rounded-t-sm ${index < 4 ? "bg-stone-200" : "bg-emerald-600/80"}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </BentoCard>
        </BentoGrid>
      </div>
    </section>
  );
}
