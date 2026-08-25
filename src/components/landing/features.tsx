import { BarChart3, Palette, Workflow, Zap, type LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  points: string[];
};

const FEATURES: Feature[] = [
  {
    icon: Workflow,
    title: "Sequenze Automatizzate",
    description:
      "Ogni pagamento fallito attiva in automatico una sequenza dunning multi-canale su WhatsApp, SMS ed Email, con i tempi di invio che decidi tu.",
    points: [
      "Invio automatico su fattura fallita",
      "Fallback tra i canali configurabile",
      "Nessun intervento manuale richiesto",
    ],
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
  },
  {
    icon: Zap,
    title: "Integrazione Stripe No-Code",
    description:
      "Incolla le tue chiavi API da Impostazioni e sei operativo: nessun deploy, nessuna riga di codice, nessun file .env da modificare.",
    points: [
      "Chiavi salvate in modo sicuro su Supabase",
      "Test di connessione in tempo reale",
      "Attivo su tutte le chiamate in pochi secondi",
    ],
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
  },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-16 py-28 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="outline"
            className="h-auto rounded-full border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-300"
          >
            Caratteristiche
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            Tutto ciò che serve per fermare il churn involontario
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            Strumenti pensati per i team che vendono in abbonamento su Stripe
            e vogliono recuperare fatturato senza alzare un dito.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group h-full border border-zinc-800/80 bg-zinc-900/60 py-8 shadow-xl shadow-black/20 ring-0 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-zinc-900"
            >
              <CardHeader className="px-8">
                <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 transition-colors group-hover:bg-emerald-500/15">
                  <feature.icon className="size-6 text-emerald-500" />
                </span>
                <CardTitle className="mt-5 text-lg font-semibold text-zinc-100">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8">
                <CardDescription className="leading-relaxed text-zinc-400">
                  {feature.description}
                </CardDescription>
                <ul className="mt-6 flex flex-col gap-2.5 border-t border-zinc-800 pt-6">
                  {feature.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-2.5 text-sm text-zinc-300"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
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
