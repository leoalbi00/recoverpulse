import { CreditCard, Link2, Mail, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const STEPS = [
  { icon: Mail, title: "Email di recupero inviata", detail: "Pochi secondi dopo il rifiuto, col brand del merchant." },
  { icon: Link2, title: "Il cliente apre il Magic Link", detail: "Nessun login: link personale, monouso e a scadenza." },
  { icon: CreditCard, title: "Nuova carta in 1 click", detail: "Inserisce la nuova carta e l'addebito riparte subito." },
];

/**
 * Terza sezione: lo smartphone del cliente con la notifica di pagamento
 * fallito e il pulsante del Magic Link, accanto ai tre passaggi del recupero.
 */
export function MagicLinkPhoneMockup() {
  return (
    <section aria-labelledby="magic-link-title" className="relative py-24 sm:py-28">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <Badge
            variant="outline"
            className="h-auto rounded-full border-emerald-600/20 bg-emerald-50 px-3 py-1 text-emerald-800"
          >
            Magic Link 1-Click
          </Badge>
          <h2
            id="magic-link-title"
            className="mt-4 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl"
          >
            Dal rifiuto al recupero, senza che il tuo team muova un dito
          </h2>
          <ul className="mt-8 flex flex-col gap-5">
            {STEPS.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm ring-1 ring-border">
                  <Icon className="size-4.5 text-emerald-700" />
                </span>
                <div>
                  <p className="font-medium text-foreground">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <Phone />
        </div>
      </div>
    </section>
  );
}

function Phone() {
  return (
    <div className="relative h-[460px] w-[230px] rounded-[2.75rem] border border-zinc-700 bg-zinc-900 p-2.5 shadow-2xl shadow-slate-900/25 sm:h-[560px] sm:w-[280px]">
      <div aria-hidden className="absolute -inset-10 -z-10 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[2.25rem] bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950">
        <div aria-hidden className="mx-auto mt-2.5 h-6 w-24 rounded-full bg-black" />

        <div className="mt-8 text-center text-white">
          <p className="text-5xl font-light tabular-nums sm:text-6xl">9:41</p>
          <p className="mt-1 text-xs text-zinc-400">giovedì 1 ottobre</p>
        </div>

        <div className="mt-8 px-3">
          <div className="rounded-2xl bg-rose-500/90 p-3.5 text-white">
            <div className="flex items-center gap-2 text-[11px] font-medium opacity-80">
              <XCircle className="size-3.5" />
              Acme SaaS · 1 min fa
            </div>
            <p className="mt-1.5 text-sm font-semibold">Pagamento non riuscito</p>
            <p className="mt-0.5 text-xs leading-snug opacity-90">
              La tua carta è scaduta. Aggiornala in 1 click per non perdere l&apos;accesso a Growth.
            </p>
          </div>
        </div>

        <div className="mt-auto px-6 pb-6">
          <div className="flex h-11 items-center justify-center rounded-xl bg-white text-sm font-semibold text-zinc-900">
            Aggiorna Carta in 1-Click
          </div>
          <div aria-hidden className="mx-auto mt-5 h-1 w-28 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
}
