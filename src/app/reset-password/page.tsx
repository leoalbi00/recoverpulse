"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, ArrowRight, CheckCircle2 } from "lucide-react";

function RequestLinkForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/30">
          <CheckCircle2 className="size-6 text-emerald-400" />
        </span>
        <p className="text-sm text-zinc-300">
          Se l&apos;indirizzo esiste, riceverai un&apos;email con le istruzioni per reimpostare la password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-zinc-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@esempio.com"
          className="h-10 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 text-base font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Invio in corso..." : "Invia link di recupero"}
        {!loading && <ArrowRight className="size-4" />}
      </button>
    </form>
  );
}

function SetNewPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "Impossibile reimpostare la password.");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch {
      setError("Impossibile reimpostare la password. Riprova.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-300">
          Nuova password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          className="h-10 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 text-base font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Salvataggio..." : "Imposta nuova password"}
        {!loading && <ArrowRight className="size-4" />}
      </button>
    </form>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none fixed -top-32 left-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[120px]"
      />

      <Link href="/" className="mb-8 flex items-center gap-2 transition-opacity hover:opacity-80">
        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500">
          <Activity className="size-4 text-zinc-950" strokeWidth={2.5} />
        </span>
        <span className="text-base font-semibold tracking-tight text-zinc-100">RecoverPulse</span>
      </Link>

      <div className="w-full max-w-sm rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-8 shadow-xl shadow-black/20 backdrop-blur-sm">
        {token ? (
          <>
            <h1 className="text-xl font-semibold text-zinc-100">Imposta una nuova password</h1>
            <p className="mt-1.5 text-sm text-zinc-400">Scegli la password che userai da ora in poi.</p>
            <SetNewPasswordForm token={token} />
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-zinc-100">Password dimenticata?</h1>
            <p className="mt-1.5 text-sm text-zinc-400">
              Inserisci la tua email: ti mandiamo un link per reimpostarla.
            </p>
            <RequestLinkForm />
          </>
        )}

        <p className="mt-6 text-center text-sm text-zinc-400">
          <Link href="/login" className="font-medium text-zinc-100 hover:underline">
            Torna al login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
