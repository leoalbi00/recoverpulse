import { BrainCircuit, CalendarClock, CreditCard, Send, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STAGES: { label: string; title: string; description: string }[] = [
  {
    label: "01 · Addebito",
    title: "Rinnovo mensile in corso",
    description: "Stripe tenta il rinnovo dell'abbonamento Growth del tuo cliente: $299.00.",
  },
  {
    label: "02 · Rifiuto",
    title: "La banca rifiuta il pagamento",
    description:
      "Senza OmniRev qui inizia il churn silenzioso: nessun avviso, il cliente perde l'accesso senza saperlo.",
  },
  {
    label: "03 · Diagnosi",
    title: "OmniRev ne capisce la causa",
    description:
      "Il codice di rifiuto viene classificato in tempo reale e decide la strategia: Magic Link immediato o riaddebito programmato.",
  },
];

const CAUSES = [
  { code: "expired_card", label: "Carta scaduta", strategy: "Magic Link immediato", active: true },
  { code: "insufficient_funds", label: "Fondi insufficienti", strategy: "Nuovo tentativo programmato", active: false },
];

/**
 * Seconda sezione: i tre passaggi della stessa fattura da $299.00
 * (addebito → rifiuto → diagnosi) elencati insieme, accanto alla fattura
 * nel suo stato finale: rifiutata e già diagnosticata da OmniRev.
 */
export function SimulationSection() {
  return (
    <section aria-labelledby="simulation-title" className="relative py-24 sm:py-28">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <Badge variant="outline" className="h-auto rounded-full bg-card px-3 py-1 text-slate-700">
            Simulazione
          </Badge>
          <h2
            id="simulation-title"
            className="mt-4 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl"
          >
            Cosa succede quando un pagamento fallisce
          </h2>

          <ol className="mt-8 flex flex-col gap-3">
            {STAGES.map((item) => (
              <li key={item.label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm sm:px-5 sm:py-4">
                <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{item.label}</p>
                <p className="mt-1 text-base font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ol>
        </div>

        <InvoiceCard />
      </div>
    </section>
  );
}

function InvoiceCard() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div aria-hidden className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-rose-500/10 blur-3xl" />

      {/* Carta "documento contabile": bordo e ombra la staccano dallo sfondo chiaro. */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-xl shadow-slate-900/10">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <p className="text-xs text-zinc-500">Fattura</p>
            <p className="font-mono text-sm font-medium">in_1Q8x2LZv · Growth</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-200">
            <XCircle className="size-3.5" />
            Rifiutato
          </span>
        </div>

        <div className="px-6 py-6">
          <p className="text-sm text-zinc-500">Importo</p>
          <p className="mt-1 text-5xl font-semibold tracking-tight text-rose-600 tabular-nums">$299.00</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
            <CreditCard className="size-4" />
            Visa •••• 4242 · scad. 09/26
          </div>
        </div>

        <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-5">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            <BrainCircuit className="size-4 text-emerald-600" />
            Diagnosi OmniRev
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {CAUSES.map((cause) => (
              <li
                key={cause.code}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-sm",
                  cause.active
                    ? "bg-white font-medium text-zinc-900 shadow-sm ring-2 ring-emerald-500"
                    : "text-zinc-500"
                )}
              >
                <span className="flex flex-col">
                  {cause.label}
                  <span className="font-mono text-[11px] font-normal text-zinc-500">{cause.code}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs">
                  {cause.active ? <Send className="size-3.5" /> : <CalendarClock className="size-3.5" />}
                  {cause.strategy}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
