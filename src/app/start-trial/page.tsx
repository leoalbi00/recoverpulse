"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { Logo } from "@/components/ui/logo";

type Step = 1 | 2 | 3;

type Step1Data = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const TRIAL_BENEFITS = [
  "Accesso completo e illimitato a tutte le funzionalità Email",
  "Nessun costo di abbonamento durante la Beta",
  "Zero carta di credito richiesta",
  "Integrazione Stripe in 1-click",
  "Assistenza dedicata",
];

async function postJson<T>(url: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, error: data.error ?? "Si è verificato un errore. Riprova più tardi." };
  }
  return { ok: true, data };
}

function TrialInfoPanel() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-xl shadow-slate-900/5">
      <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
        Beta Gratuita
      </span>
      <h1 className="mt-4 text-xl font-semibold text-foreground">Prova OmniRev senza rischi</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Recupera i pagamenti falliti in automatico, senza impegno e senza costi di abbonamento.
      </p>

      <ul className="mt-8 flex flex-col gap-3.5">
        {TRIAL_BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2.5 text-sm text-slate-700">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepOneForm({
  initialData,
  onSubmitted,
}: {
  initialData: Step1Data;
  onSubmitted: (data: Step1Data) => void;
}) {
  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [email, setEmail] = useState(initialData.email);
  const [phone, setPhone] = useState(initialData.phone);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await postJson("/api/trial-signup/start", { firstName, lastName, email, phone });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onSubmitted({ firstName, lastName, email, phone });
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-foreground">Inizia la prova gratuita</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Compila i tuoi dati per creare l&apos;account.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
              Nome
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Mario"
              className="h-10 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
              Cognome
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Rossi"
              className="h-10 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email aziendale
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@azienda.com"
            className="h-10 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm font-medium text-slate-700">
            Numero di telefono
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+39 333 1234567"
            className="h-10 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {error && <p className="text-sm text-rose-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-slate-900/10 transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Invio in corso..." : "Continua"}
          {!loading && <ArrowRight className="size-4" />}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Hai già un account?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Accedi
        </Link>
      </p>
    </>
  );
}

function StepTwoOtp({
  data,
  onVerified,
  onBack,
}: {
  data: Step1Data;
  onVerified: (code: string) => void;
  onBack: () => void;
}) {
  const { email } = data;
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await postJson("/api/trial-signup/verify-otp", { email, code });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onVerified(code);
  }

  async function handleResend() {
    setError(null);
    setResending(true);
    // Riusa /api/trial-signup/start: l'upsert su email lato server
    // (startTrialSignup) sovrascrive la richiesta precedente con un nuovo
    // codice, invece di richiedere una route dedicata al reinvio.
    const result = await postJson("/api/trial-signup/start", data);
    setResending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Modifica dati
      </button>

      <h2 className="mt-4 text-xl font-semibold text-foreground">Inserisci il codice</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Abbiamo inviato un codice di attivazione a <span className="text-foreground">{email}</span>.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="otp" className="text-sm font-medium text-slate-700">
            Codice di attivazione
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="h-12 rounded-lg border border-slate-300 bg-card px-3 text-center text-xl font-semibold tracking-[0.4em] text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {resent && <p className="text-sm text-emerald-700">Nuovo codice inviato.</p>}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-slate-900/10 transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Verifica in corso..." : "Verifica codice"}
          {!loading && <ArrowRight className="size-4" />}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
        >
          {resending ? "Invio in corso..." : "Non hai ricevuto il codice? Invialo di nuovo"}
        </button>
      </form>
    </>
  );
}

function StepThreePassword({
  email,
  code,
  onError,
}: {
  email: string;
  code: string;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [acceptedDataAccuracy, setAcceptedDataAccuracy] = useState(false);
  const [acceptedVexatiousClauses, setAcceptedVexatiousClauses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    if (!acceptedLegal || !acceptedDataAccuracy || !acceptedVexatiousClauses) {
      setError("Devi accettare tutte le dichiarazioni per continuare.");
      return;
    }

    setLoading(true);

    const result = await postJson<{ email: string }>("/api/trial-signup/complete", { email, code, password });

    if (!result.ok) {
      // Un errore qui (es. codice scaduto nel frattempo) riporta l'utente
      // allo Step 1: la riga trial_signups potrebbe non essere più valida.
      onError(result.error);
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", { email, password, redirect: false });

    if (signInResult?.error) {
      setError("Account creato, ma l'accesso automatico è fallito. Prova ad accedere.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-foreground">Crea la tua password</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Ultimo passaggio: scegli una password per il tuo account.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="h-10 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
            Conferma password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••"
            className="h-10 rounded-lg border border-slate-300 bg-card px-3 text-sm text-foreground placeholder:text-slate-400 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-col gap-2.5 border-t border-border pt-4">
          <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              required
              checked={acceptedLegal}
              onChange={(event) => setAcceptedLegal(event.target.checked)}
              className="mt-0.5 size-3.5 shrink-0 rounded border-border bg-card accent-emerald-600"
            />
            <span>
              Accetto i{" "}
              <Link href="/termini" target="_blank" className="text-foreground hover:underline">
                Termini di Servizio
              </Link>
              , la{" "}
              <Link href="/privacy" target="_blank" className="text-foreground hover:underline">
                Privacy Policy
              </Link>{" "}
              e la{" "}
              <Link href="/dpa" target="_blank" className="text-foreground hover:underline">
                Nomina a Responsabile del Trattamento (DPA)
              </Link>
              .
            </span>
          </label>

          <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              required
              checked={acceptedDataAccuracy}
              onChange={(event) => setAcceptedDataAccuracy(event.target.checked)}
              className="mt-0.5 size-3.5 shrink-0 rounded border-border bg-card accent-emerald-600"
            />
            <span>
              Dichiaro che i dati aziendali forniti sono veritieri e di avere
              il diritto di gestire le transazioni dell&apos;attività.
            </span>
          </label>

          <label className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2.5 text-xs text-slate-700">
            <input
              type="checkbox"
              required
              checked={acceptedVexatiousClauses}
              onChange={(event) => setAcceptedVexatiousClauses(event.target.checked)}
              className="mt-0.5 size-3.5 shrink-0 rounded border-border bg-card accent-emerald-600"
            />
            <span>
              Ai sensi e per gli effetti degli artt. 1341 e 1342 c.c.,
              dichiaro di aver letto e di approvare espressamente le
              seguenti clausole dei Termini di Servizio:{" "}
              <Link href="/termini#manleva" target="_blank" className="text-foreground hover:underline">
                Art. 3 (Manleva e Garanzia sui Crediti)
              </Link>
              ,{" "}
              <Link href="/termini#limitazione-responsabilita" target="_blank" className="text-foreground hover:underline">
                Art. 4 (Limite Massimo di Responsabilità)
              </Link>
              ,{" "}
              <Link href="/termini#aup" target="_blank" className="text-foreground hover:underline">
                Art. 6 (Acceptable Use Policy e Sospensione Immediata Senza Rimborso)
              </Link>{" "}
              e{" "}
              <Link href="/termini#legge-foro" target="_blank" className="text-foreground hover:underline">
                Art. 9 (Foro Competente Esclusivo)
              </Link>
              .
            </span>
          </label>
        </div>

        {error && <p className="text-sm text-rose-700">{error}</p>}

        <button
          type="submit"
          disabled={loading || !acceptedLegal || !acceptedDataAccuracy || !acceptedVexatiousClauses}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-slate-900/10 transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Creazione account..." : "Crea account e accedi"}
          {!loading && <ArrowRight className="size-4" />}
        </button>
      </form>
    </>
  );
}

export default function StartTrialPage() {
  const [step, setStep] = useState<Step>(1);
  const [signupData, setSignupData] = useState<Step1Data>({ firstName: "", lastName: "", email: "", phone: "" });
  const [code, setCode] = useState("");
  const [stepError, setStepError] = useState<string | null>(null);

  return (
    <div className="light flex min-h-screen flex-col items-center bg-muted px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none fixed -top-32 left-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]"
      />

      <Link href="/" className="mb-8">
        <Logo />
      </Link>

      <div className="flex w-full max-w-4xl flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
        <TrialInfoPanel />

        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-xl shadow-slate-900/5">
          {stepError && (
            <p className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700">
              {stepError}
            </p>
          )}

          {step === 1 && (
            <StepOneForm
              initialData={signupData}
              onSubmitted={(data) => {
                setStepError(null);
                setSignupData(data);
                setStep(2);
              }}
            />
          )}

          {step === 2 && (
            <StepTwoOtp
              data={signupData}
              onBack={() => {
                setStepError(null);
                setStep(1);
              }}
              onVerified={(verifiedCode) => {
                setStepError(null);
                setCode(verifiedCode);
                setStep(3);
              }}
            />
          )}

          {step === 3 && (
            <StepThreePassword
              email={signupData.email}
              code={code}
              onError={(message) => {
                setStepError(message);
                setStep(1);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
