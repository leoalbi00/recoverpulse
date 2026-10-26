import { CreditCard, Lock, ShieldCheck, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SecurityBadge = {
  icon: LucideIcon;
  label: string;
  detail: string;
};

// PCI-DSS: i dati carta sono raccolti solo dal PaymentElement di Stripe
// (update-payment-form.tsx) e non transitano mai dai server OmniRev, quindi
// il livello 1 è quello di Stripe, e va dichiarato così.
export const SECURITY_BADGES: SecurityBadge[] = [
  {
    icon: ShieldCheck,
    label: "GDPR Compliant",
    detail: "DPA per il trattamento dati, minimizzazione e cancellazione su richiesta.",
  },
  {
    icon: CreditCard,
    label: "PCI-DSS Level 1 via Stripe",
    detail: "I numeri di carta restano su Stripe: OmniRev non li vede né li salva.",
  },
  {
    icon: Lock,
    label: "Crittografia SSL 256-bit",
    detail: "Traffico TLS end-to-end e token di accesso cifrati a riposo.",
  },
];

/** Riga compatta di badge, per Hero e vicino alle CTA. */
export function SecurityBadgeRow({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      {SECURITY_BADGES.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-slate-700"
        >
          <Icon className="size-3.5 text-emerald-600" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}

/** Fascia "Sicurezza enterprise" con descrizione per ogni garanzia. */
export function SecuritySection() {
  return (
    <section aria-labelledby="security-title" className="border-y border-border bg-muted py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="security-title" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Sicurezza di livello enterprise, dal primo giorno
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Colleghi Stripe in sola autorizzazione OAuth: nessuna chiave da copiare, nessun dato carta
            sui nostri server.
          </p>
        </div>
        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {SECURITY_BADGES.map(({ icon: Icon, label, detail }) => (
            <li key={label} className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-emerald-600/15">
                <Icon className="size-5 text-emerald-700" aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-foreground">{label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
