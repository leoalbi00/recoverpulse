"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight } from "lucide-react";

import { Logo } from "@/components/ui/logo";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, inviteCode }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Errore durante la registrazione.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Account creato, ma l'accesso automatico è fallito. Prova ad accedere.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="light flex min-h-screen flex-col items-center justify-center bg-muted px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none fixed -top-32 left-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]"
      />

      <Link href="/" className="mb-8">
        <Logo />
      </Link>

      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-xl shadow-slate-900/5">
        <h1 className="text-xl font-semibold text-foreground">Crea il tuo account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Accesso su invito: richiedi il pilota dalla home page per ricevere il tuo codice.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="inviteCode" className="text-sm font-medium text-slate-700">
              Codice invito
            </label>
            <input
              id="inviteCode"
              type="text"
              required
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="Ricevuto via email dopo la richiesta pilota"
              className="h-10 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Nome
            </label>
            <input
              id="name"
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Il tuo nome"
              className="h-10 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@esempio.com"
              className="h-10 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Almeno 6 caratteri"
              className="h-10 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-slate-700"
            >
              Conferma password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Ripeti la password"
              className="h-10 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Stesse dichiarazioni di /start-trial: senza, l'account nasce senza accettazione dei Termini/DPA. */}
          <div className="flex flex-col gap-2.5 border-t border-border pt-4">
            <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                required
                className="mt-0.5 size-3.5 shrink-0 rounded border-border bg-card accent-emerald-600"
              />
              <span>
                Accetto i{" "}
                <Link href="/termini" target="_blank" className="text-foreground hover:underline">
                  Termini di Servizio
                </Link>{" "}
                e la{" "}
                <Link href="/dpa" target="_blank" className="text-foreground hover:underline">
                  Nomina a Responsabile del Trattamento (DPA)
                </Link>{" "}
                e dichiaro di aver letto la{" "}
                <Link href="/privacy" target="_blank" className="text-foreground hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2.5 text-xs text-slate-700">
              <input
                type="checkbox"
                required
                className="mt-0.5 size-3.5 shrink-0 rounded border-border bg-card accent-emerald-600"
              />
              <span>
                Ai sensi e per gli effetti degli artt. 1341 e 1342 c.c., dichiaro di aver letto e di approvare
                espressamente gli artt. 3 (Manleva), 4 (Limite di Responsabilità), 5 (Assenza di garanzia di
                risultato), 6 (Sospensione senza rimborso), 7 (Servizi di terze parti), 9 (Foro esclusivo), 12
                (Non rimborsabilità), 13 (Rinnovo automatico e risoluzione), 14 (Modifiche unilaterali) e 15.3
                (Cessione) dei{" "}
                <Link href="/termini" target="_blank" className="text-foreground hover:underline">
                  Termini di Servizio
                </Link>
                .
              </span>
            </label>
          </div>

          {error && <p className="text-sm text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-slate-900/10 transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Creazione account..." : "Crea account"}
            {!loading && <ArrowRight className="size-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Hai già un account?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
