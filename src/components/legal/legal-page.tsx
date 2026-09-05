import Link from "next/link";
import { Activity } from "lucide-react";

import { Footer } from "@/components/landing/footer";

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
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
        <div className="mx-auto max-w-3xl px-6 py-14">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">Ultimo aggiornamento: {updatedAt}</p>

          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            Documento in bozza a scopo dimostrativo: da far validare da un
            consulente legale prima di pubblicarlo in produzione, con i dati
            reali della società (ragione sociale, sede legale, Partita IVA,
            titolare del trattamento).
          </div>

          <div className="prose-legal mt-10 flex flex-col gap-8 text-sm leading-relaxed text-zinc-300">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      <div className="mt-2.5 flex flex-col gap-2.5 text-zinc-300">{children}</div>
    </section>
  );
}
