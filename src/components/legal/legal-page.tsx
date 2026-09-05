import Link from "next/link";
import { Activity } from "lucide-react";

import { Footer } from "@/components/landing/footer";

type TocItem = { id: string; label: string };

export function LegalPage({
  title,
  updatedAt,
  toc,
  children,
}: {
  title: string;
  updatedAt: string;
  toc: TocItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500">
              <Activity className="size-4 text-zinc-950" strokeWidth={2.5} />
            </span>
            <span className="text-base font-semibold tracking-tight text-zinc-100">
              RecoverPulse
            </span>
          </Link>
          <Link href="/" className="text-sm text-zinc-400 transition-colors hover:text-zinc-100">
            Torna al sito
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">Ultimo aggiornamento: {updatedAt}</p>

          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
            Documento in bozza a scopo dimostrativo: da far validare da un
            consulente legale prima di pubblicarlo in produzione, con i dati
            reali della società (ragione sociale, sede legale, Partita IVA,
            titolare del trattamento, foro competente).
          </div>

          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
            <nav aria-label="Indice dei contenuti" className="lg:sticky lg:top-8 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Indice
              </p>
              <ol className="mt-3 flex flex-col gap-2 border-l border-zinc-800 pl-4 text-sm">
                {toc.map((item, index) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-zinc-400 transition-colors hover:text-emerald-400"
                    >
                      {index + 1}. {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="prose-legal flex max-w-2xl flex-col gap-10 text-sm leading-relaxed text-zinc-300">
              {children}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      <div className="mt-2.5 flex flex-col gap-2.5 text-zinc-300">{children}</div>
    </section>
  );
}

export function LegalSubsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <div className="flex flex-col gap-2 text-zinc-300">{children}</div>
    </div>
  );
}
