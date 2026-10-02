import { ArrowRight, CreditCard, Lock, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GridPattern } from "@/components/ui/grid-pattern";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";
import { DemoVideoDialog } from "@/components/landing/demo-video";

const TRUST_BADGES = [
  { icon: Lock, label: "Cifratura SSL 256-bit" },
  { icon: ShieldCheck, label: "GDPR Compliant" },
  { icon: CreditCard, label: "Connessione Stripe OAuth" },
];

/**
 * Hero in un'unica colonna, tutto nel normale flusso del documento: testo,
 * CTA e anteprima della dashboard uno sotto l'altro, senza trasformazioni 3D,
 * sticky o elementi assoluti che possano sovrapporsi a navbar o contenuti su
 * laptop 11-13". La variante `short:` (max-height 700px) compatta solo
 * tipografia e spaziature.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-x-clip">
      <GridPattern />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgb(16_185_129/0.12),transparent_70%)]"
      />

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 py-16 md:gap-16 md:py-24 short:gap-8 short:py-12">
        <div className="flex max-w-3xl flex-col items-center gap-6 text-center short:gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-50/[0.03] px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Il churn involontario costa in media il 9% dell&apos;MRR
          </span>

          <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance text-zinc-50 md:text-6xl md:leading-[1.05] short:md:text-5xl">
            Recupera fino al <span className="text-emerald-400">40% del fatturato</span> perso per pagamenti
            falliti.
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-pretty text-zinc-400 md:text-lg short:md:text-base">
            OmniRev intercetta ogni addebito rifiutato, ne classifica la causa, ritenta al momento giusto e invia al
            cliente un link 1-click per aggiornare la carta. Il tuo team non insegue nessuno.
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              size="lg"
              render={<a href="/start-trial" />}
              className="h-12 gap-2 rounded-full px-7 text-base font-semibold shadow-[0_0_24px_-6px_rgb(16_185_129/0.6)]"
            >
              Inizia Gratis
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
            <DemoVideoDialog />
          </div>

          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <Icon className="size-3.5 text-emerald-500/80" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full max-w-4xl short:max-w-2xl">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
