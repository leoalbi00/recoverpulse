"use client";

import { CreditCard, Fingerprint, Info, Lock, RefreshCcwDot, ShieldCheck } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GridPattern } from "@/components/ui/grid-pattern";
import { SectionHeading } from "@/components/landing/section-heading";

const TRUST_ITEMS = [
  {
    icon: Lock,
    title: "Cifratura SSL 256-bit",
    description: "Tutto il traffico tra browser, OmniRev e gateway viaggia su HTTPS.",
    detail: "Connessioni TLS su ogni endpoint: dashboard, portale di pagamento, API e webhook.",
  },
  {
    icon: ShieldCheck,
    title: "GDPR Compliance",
    description: "DPA disponibile e trattamento dei dati limitato al recupero dei pagamenti.",
    detail: "Il Data Processing Agreement è consultabile alla pagina /dpa, insieme a privacy e cookie policy.",
  },
  {
    icon: RefreshCcwDot,
    title: "Idempotenza Webhook",
    description: "Ogni evento dei gateway è elaborato una sola volta, anche se consegnato due volte.",
    detail:
      "Ogni (provider, event_id) è registrato con un vincolo di unicità: una ridelivery di Stripe, PayPal o GoCardless non genera mai email o addebiti doppi.",
  },
  {
    icon: CreditCard,
    title: "PCI-DSS Ready",
    description: "I dati della carta non transitano mai sui server OmniRev.",
    detail:
      "Il portale di aggiornamento carta usa Stripe Elements: numero e CVC vanno direttamente a Stripe, certificato PCI DSS Level 1.",
  },
];

/** Sezione conformità: quattro garanzie con il dettaglio tecnico in tooltip. */
export function SecurityTrust() {
  return (
    <section
      id="sicurezza"
      aria-labelledby="security-title"
      className="relative isolate scroll-mt-24 overflow-x-clip border-y border-white/5 bg-black py-16 md:py-24"
    >
      <GridPattern mask="radial-gradient(ellipse 60% 70% at 50% 50%, black 20%, transparent 70%)" />

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 md:gap-16">
        <SectionHeading
          id="security-title"
          eyebrow="Sicurezza & Conformità"
          icon={Fingerprint}
          title="Costruito per maneggiare denaro"
          description="Le stesse garanzie che ti aspetti dal tuo gateway di pagamento, applicate a ogni sollecito e a ogni riaddebito."
        />

        <TooltipProvider delayDuration={150}>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {TRUST_ITEMS.map(({ icon: Icon, title, description, detail }) => (
              <li
                key={title}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-950/80 p-6 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06]">
                    <Icon className="size-5 text-emerald-400" />
                  </span>
                  <Tooltip>
                    <TooltipTrigger
                      className="flex size-7 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-50/5 hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:outline-none"
                      aria-label={`Dettagli: ${title}`}
                    >
                      <Info className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent>{detail}</TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </TooltipProvider>
      </div>
    </section>
  );
}
