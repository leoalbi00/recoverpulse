import { BarChart3, Palette, Workflow, Zap, type LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  points: string[];
  /** Classi di griglia della Bento: le card larghe occupano 2 colonne su desktop. */
  span: string;
};

const FEATURES: Feature[] = [
  {
    icon: Workflow,
    title: "Sequenze Automatizzate",
    description:
      "Ogni pagamento fallito attiva in automatico una sequenza dunning via Email, con i tempi di invio che decidi tu. SMS e WhatsApp arrivano nella versione Pro.",
    points: [
      "Invio automatico su fattura fallita",
      "Template pronti, personalizzabili in dashboard",
      "Nessun intervento manuale richiesto",
    ],
    span: "lg:col-span-2",
  },
  {
    icon: Palette,
    title: "Portale White-Label",
    description:
      "Il portale 1-click di aggiornamento carta e le email di sollecito mostrano il tuo logo, il nome della tua azienda e il tuo colore di brand, non il nostro.",
    points: [
      "Logo e colori personalizzabili in dashboard",
      "Upload diretto del logo via drag & drop",
      "Anteprima live prima di pubblicare",
    ],
    span: "",
  },
  {
    icon: Zap,
    title: "Stripe collegato in 1 click",
    description:
      "Autorizzi OmniRev con OAuth di Stripe Connect e sei operativo: nessuna chiave API da copiare, nessuna riga di codice, nessun deploy.",
    points: [
      "Token di accesso cifrati a riposo",
      "Revocabile in ogni momento da Stripe",
      "Attivo sulle nuove fatture in pochi secondi",
    ],
    span: "",
  },
  {
    icon: BarChart3,
    title: "Analytics in Tempo Reale",
    description:
      "Fatturato recuperato, tasso di recupero e pagamenti in corso in un'unica dashboard aggiornata via webhook Stripe, senza fogli di calcolo.",
    points: [
      "Fatturato recuperato in tempo reale",
      "Tasso di recupero e pagamenti attivi",
      "Aggiornata automaticamente via webhook",
    ],
    span: "lg:col-span-2",
  },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-16 border-y border-border bg-muted py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="outline"
            className="h-auto rounded-full bg-card px-3 py-1 text-slate-700"
          >
            Caratteristiche
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Tutto ciò che serve per fermare il churn involontario
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Per i team B2B che fatturano in abbonamento su Stripe: ogni pagamento
            rifiutato diventa un recupero automatico, misurabile in dashboard.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className={cn(
                "group h-full border border-border py-7 shadow-sm ring-0",
                feature.span
              )}
            >
              <CardHeader className="px-7">
                <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-600/15">
                  <feature.icon className="size-6 text-emerald-700" />
                </span>
                <CardTitle className="mt-5 text-lg font-semibold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-7">
                <CardDescription className="max-w-prose leading-relaxed">
                  {feature.description}
                </CardDescription>
                <ul className="mt-6 flex flex-col gap-2.5 border-t border-border pt-6">
                  {feature.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-2.5 text-sm text-slate-700"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
