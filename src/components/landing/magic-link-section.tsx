import { CreditCard, Link2, Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const STEPS = [
  { icon: Mail, title: "Email di recupero inviata", detail: "Pochi secondi dopo il rifiuto, col brand del merchant." },
  { icon: Link2, title: "Il cliente apre il Magic Link", detail: "Nessun login: link personale, monouso e a scadenza." },
  { icon: CreditCard, title: "Nuova carta in 1 click", detail: "Inserisce la nuova carta e l'addebito riparte subito." },
];

/** Sezione Magic Link: i tre passaggi del recupero, dal rifiuto alla nuova carta. */
export function MagicLinkSection() {
  return (
    <section aria-labelledby="magic-link-title" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
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
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, detail }, index) => (
            <li key={title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-600/15">
                  <Icon className="size-5 text-emerald-700" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
              </div>
              <p className="mt-5 font-semibold text-foreground">{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
