import Link from "next/link";
import { Activity } from "lucide-react";

type SocialLink = {
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.JSX.Element;
};

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947C23.73 2.7 21.31.273 16.949.073 15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.558V9h3.556v11.452z" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" />
  </svg>
);

const SOCIAL_LINKS: SocialLink[] = [
  { label: "X (Twitter)", href: "https://x.com", icon: XIcon },
  { label: "Instagram", href: "https://instagram.com", icon: InstagramIcon },
  { label: "LinkedIn", href: "https://linkedin.com", icon: LinkedinIcon },
  { label: "YouTube", href: "https://youtube.com", icon: YoutubeIcon },
];

type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Prodotto",
    links: [
      { label: "Caratteristiche", href: "#features" },
      { label: "Prezzi", href: "#pricing" },
      { label: "Integrazioni", href: "#" },
      { label: "Novità", href: "#" },
    ],
  },
  {
    title: "Azienda",
    links: [
      { label: "Chi siamo", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Carriere", href: "#" },
      { label: "Contatti", href: "#" },
    ],
  },
  {
    title: "Risorse",
    links: [
      { label: "Centro assistenza", href: "#" },
      { label: "Documentazione API", href: "#" },
      { label: "Community", href: "#" },
      { label: "Stato del sistema", href: "#" },
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
    <footer className="border-t border-zinc-800">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 flex flex-col gap-4 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500">
                <Activity className="size-4 text-zinc-950" strokeWidth={2.5} />
              </span>
              <span className="text-base font-semibold tracking-tight text-zinc-100">
                RecoverPulse
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
              Recupera i pagamenti falliti su Stripe con dunning automatico
              multi-canale e un portale di aggiornamento carta senza attriti.
            </p>
            <div className="mt-2 flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <span className="text-sm font-medium text-zinc-100">
                {column.title}
              </span>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 border-t border-zinc-800 pt-8 text-sm text-zinc-500 sm:flex-row sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} RecoverPulse. Tutti i diritti
            riservati.
          </span>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-zinc-300">
              Privacy
            </a>
            <a href="/termini" className="hover:text-zinc-300">
              Termini
            </a>
            <a href="/dpa" className="hover:text-zinc-300">
              DPA
            </a>
            <a href="/cookie" className="hover:text-zinc-300">
              Cookie
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
