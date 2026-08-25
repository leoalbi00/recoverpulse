import { ArrowRight, AlertTriangle, CreditCard, Lock, ShieldCheck, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATS = [
  { value: "40%", label: "del fatturato perso recuperato" },
  { value: "9%", label: "MRR medio a rischio churn involontario" },
  { value: "5 min", label: "per collegare Stripe, no-code" },
];

const TRUST_BADGES = [
  { icon: Lock, label: "Crittografia SSL a 256-bit" },
  { icon: ShieldCheck, label: "GDPR Compliant" },
  { icon: CreditCard, label: "Stripe Compatible" },
];

const MOCK_TRANSACTIONS = [
  { name: "Nova Studio SRL", amount: "€89,00", status: "recuperato" as const },
  { name: "Blue Ocean Agency", amount: "€199,00", status: "in_corso" as const },
  { name: "Marco Rossi Consulting", amount: "€39,00", status: "in_corso" as const },
];

const STATUS_STYLES = {
  recuperato: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  in_corso: "bg-amber-400/10 text-amber-400 ring-amber-400/20",
};

const STATUS_LABEL = {
  recuperato: "Recuperato",
  in_corso: "In corso",
};

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-md lg:max-w-none">
      <div
        aria-hidden
        className="absolute -inset-4 -z-10 rounded-[2rem] bg-emerald-500/10 blur-2xl"
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 border-b border-zinc-800 bg-zinc-950/60 px-4 py-3">
          <span className="size-2.5 rounded-full bg-zinc-700" />
          <span className="size-2.5 rounded-full bg-zinc-700" />
          <span className="size-2.5 rounded-full bg-zinc-700" />
          <span className="ml-3 truncate text-xs text-zinc-500">recoverpulse.app/dashboard</span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-[10px] text-zinc-500">Recuperato</p>
              <p className="mt-1 text-sm font-semibold text-zinc-100 sm:text-base">€12.480</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-[10px] text-zinc-500">Tasso Recupero</p>
              <p className="mt-1 text-sm font-semibold text-emerald-400 sm:text-base">68%</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-[10px] text-zinc-500">In Recupero</p>
              <p className="mt-1 text-sm font-semibold text-zinc-100 sm:text-base">14</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex items-end gap-1.5 sm:gap-2">
              {[40, 65, 45, 80, 60, 95, 70, 85, 55, 90, 75, 100].map((height, index) => (
                <div key={index} className="flex-1">
                  <div
                    className="rounded-t bg-gradient-to-t from-emerald-500/80 to-emerald-400"
                    style={{ height: `${height * 0.4}px` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {MOCK_TRANSACTIONS.map((tx) => (
              <div
                key={tx.name}
                className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2"
              >
                <span className="truncate text-xs font-medium text-zinc-300">{tx.name}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-zinc-400">{tx.amount}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${STATUS_STYLES[tx.status]}`}
                  >
                    {STATUS_LABEL[tx.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer interno, nel normale flusso del documento: non è più un
            elemento "absolute" fluttuante, quindi non può mai sovrapporsi
            alla lista transazioni qui sopra a nessuna larghezza di schermo. */}
        <div className="flex items-center gap-3 border-t border-zinc-800 bg-zinc-950/60 px-5 py-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <TrendingUp className="size-4 text-emerald-400" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-500">Questo mese</p>
            <p className="truncate text-sm font-semibold text-zinc-100">+€3.240 recuperati</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_20%,transparent_75%)]"
      />
      <div
        aria-hidden
        className="absolute -top-32 left-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="absolute top-10 right-0 -z-10 h-[380px] w-[380px] rounded-full bg-zinc-100/5 blur-[100px]"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Badge
            variant="outline"
            className="h-auto gap-1.5 rounded-full border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-zinc-300"
          >
            <AlertTriangle className="size-3.5 text-amber-400" />
            Il churn involontario costa in media il 9% dell&apos;MRR
          </Badge>

          <h1 className="mt-8 text-4xl font-semibold tracking-tight text-zinc-100 sm:text-6xl">
            Recupera fino al{" "}
            <span className="text-emerald-500">40% del fatturato perso</span>
            <br className="hidden sm:block" />
            per carte di credito scadute.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            RecoverPulse intercetta ogni pagamento fallito su Stripe e avvia in
            automatico una sequenza di solleciti multi-canale con link 1-click
            per aggiornare la carta — senza che il tuo team debba inseguire un
            solo cliente.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button
              size="lg"
              render={<a href="/register" />}
              className="h-12 gap-2 rounded-full px-8 text-base font-semibold shadow-lg shadow-emerald-500/20"
            >
              Inizia la Prova Gratuita
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<a href="#roi-calculator" />}
              className="h-12 rounded-full px-8 text-base font-medium"
            >
              Calcola quanto puoi recuperare
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 lg:justify-start">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <Icon className="size-3.5 text-emerald-500/80" />
                {label}
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-zinc-500">
            Nessuna carta di credito richiesta &middot; connetti Stripe in pochi minuti, no-code
          </p>

          <div className="mt-14 grid w-full max-w-lg grid-cols-3 gap-4 border-t border-zinc-800 pt-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center lg:items-start">
                <span className="text-2xl font-semibold text-zinc-100 sm:text-3xl">
                  {stat.value}
                </span>
                <span className="mt-1 text-center text-xs text-zinc-500 sm:text-left sm:text-sm">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}
