import Link from "next/link";

import { Logo } from "@/components/ui/logo";

// Social e link "Azienda"/"Risorse" rimossi finché non esistono pagine/profili
// reali: link a "#" o alle home generiche dei social sono fuorvianti e la
// voce "Contatti" senza recapito non soddisfa gli obblighi informativi
// (D.Lgs. 70/2003, art. 7). Vanno reintrodotti con URL effettivi.

type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Prodotto",
    links: [
      { label: "Caratteristiche", href: "/#features" },
      { label: "Prezzi", href: "/#pricing" },
      { label: "Integrazione pilota", href: "/#pilot" },
    ],
  },
  {
    title: "Legale",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Termini di servizio", href: "/termini" },
      { label: "DPA (Trattamento Dati)", href: "/dpa" },
      { label: "Cookie", href: "/cookie" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-4 lg:col-span-2">
            <Link href="/">
              <Logo animated={false} />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Recupera i pagamenti falliti su Stripe con dunning automatico
              multi-canale e un portale di aggiornamento carta senza attriti.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <span className="text-sm font-medium text-foreground">
                {column.title}
              </span>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} OmniRev. Tutti i diritti
            riservati.
          </span>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-foreground">
              Privacy
            </a>
            <a href="/termini" className="hover:text-foreground">
              Termini
            </a>
            <a href="/dpa" className="hover:text-foreground">
              DPA
            </a>
            <a href="/cookie" className="hover:text-foreground">
              Cookie
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
