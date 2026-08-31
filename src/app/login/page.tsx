"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Activity, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

function PasswordLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email o password non corretti.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-zinc-300">
            Password
          </label>
          <Link href="/reset-password" className="text-xs text-zinc-400 hover:text-zinc-200">
            Password dimenticata?
          </Link>
        </div>
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
        {loading ? "Accesso in corso..." : "Accedi"}
        {!loading && <ArrowRight className="size-4" />}
      </button>
    </form>
  );
}

function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/magic-link", {
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
      <div className="mt-8 flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/30">
          <CheckCircle2 className="size-6 text-emerald-400" />
        </span>
        <p className="text-sm text-zinc-300">
          Se l&apos;indirizzo esiste, riceverai un&apos;email con il link di accesso.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="magic-email" className="text-sm font-medium text-zinc-300">
          Email
        </label>
        <input
          id="magic-email"
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
        {loading ? "Invio in corso..." : "Invia Magic Link"}
        {!loading && <ArrowRight className="size-4" />}
      </button>
    </form>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const magicLinkError = searchParams.get("error") === "magic-link";
  const [mode, setMode] = useState<"password" | "magic-link">(magicLinkError ? "magic-link" : "password");

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
        <span className="text-base font-semibold tracking-tight text-zinc-100">
          RecoverPulse
        </span>
      </Link>

      <div className="w-full max-w-sm rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-8 shadow-xl shadow-black/20 backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-zinc-100">Bentornato</h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Accedi per vedere il tuo punteggio di recupero.
        </p>

        {magicLinkError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2.5 text-sm text-amber-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>Il link non è più valido o è scaduto. Richiedine uno nuovo qui sotto.</span>
          </div>
        )}

        <div className="mt-6 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950/60 p-1">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
              mode === "password" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMode("magic-link")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
              mode === "magic-link" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Magic Link
          </button>
        </div>

        {mode === "password" ? <PasswordLoginForm /> : <MagicLinkForm />}

        <p className="mt-6 text-center text-sm text-zinc-400">
          Non hai un account?{" "}
          <Link href="/register" className="font-medium text-zinc-100 hover:underline">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
