import { ArrowRight, CreditCard, Lock, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATS = [
  { value: "70%", label: "pagamenti falliti recuperati" },
  { value: "3", label: "canali: WhatsApp, SMS, Email" },
  { value: "14gg", label: "di prova gratuita" },
];

const TRUST_BADGES = [
  { icon: Lock, label: "Crittografia SSL a 256-bit" },
  { icon: ShieldCheck, label: "GDPR Compliant" },
  { icon: CreditCard, label: "Stripe Compatible" },
];

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

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-28 pb-24 text-center sm:pt-40 sm:pb-32">
        <Badge
          variant="outline"
          className="h-auto gap-1.5 rounded-full border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-zinc-300"
        >
          <Sparkles className="size-3.5 text-emerald-500" />
          B2B Dunning Automation
        </Badge>

        <h1 className="mt-8 text-5xl font-semibold tracking-tight text-zinc-100 sm:text-7xl">
          Recupera fino al 70% dei pagamenti falliti su Stripe
          <br />
          <span className="text-emerald-500">in modo automatico.</span>
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          Recupera i ricavi persi da carte scadute senza inseguire i clienti
          manualmente. Attivazione in meno di 5 minuti.
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Button
            size="lg"
            render={<a href="/register" />}
            className="h-12 gap-2 rounded-full px-8 text-base font-semibold shadow-lg shadow-emerald-500/20"
          >
            Inizia Prova Gratuita di 14 Giorni
            <ArrowRight className="size-4" data-icon="inline-end" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<a href="/login" />}
            className="h-12 rounded-full px-8 text-base font-medium"
          >
            Accedi
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <Icon className="size-3.5 text-emerald-500/80" />
              {label}
            </div>
          ))}
        </div>

        <p className="mt-5 text-xs text-zinc-500">
          Nessuna carta di credito richiesta &middot; connetti Stripe in pochi minuti
        </p>

        <div className="mt-20 grid w-full max-w-lg grid-cols-3 gap-4 border-t border-zinc-800 pt-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-2xl font-semibold text-zinc-100 sm:text-3xl">
                {stat.value}
              </span>
              <span className="mt-1 text-xs text-zinc-500 sm:text-sm">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
