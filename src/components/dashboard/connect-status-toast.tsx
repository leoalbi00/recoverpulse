"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const PROVIDER_LABELS: Record<string, string> = {
  stripe: "Stripe",
  paypal: "PayPal",
  gocardless: "GoCardless",
};

const MESSAGES: Record<string, (provider: string) => string> = {
  success: (provider) => `${provider} collegato con successo!`,
  error: (provider) => `Collegamento a ${provider} non riuscito. Riprova.`,
  cancelled: (provider) => `Collegamento a ${provider} annullato.`,
};

/**
 * Toast che legge ?provider=&connected= dal redirect di ritorno dei flussi
 * OAuth 1-click (Stripe Connect, PayPal Partner, GoCardless), poi ripulisce
 * l'URL con router.replace così un refresh della pagina non lo rimostra.
 * Componente separato (non dentro PaymentIntegrationsPanel) perché
 * useSearchParams() richiede un proprio Suspense boundary
 * (src/app/dashboard/impostazioni/page.tsx).
 */
export function ConnectStatusToast() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const provider = searchParams.get("provider");
  const connected = searchParams.get("connected");
  const [visible, setVisible] = useState(Boolean(provider && connected));

  useEffect(() => {
    if (!provider || !connected) return;
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), 4000);
    router.replace("/dashboard/impostazioni#metodi-pagamento", { scroll: false });
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, connected]);

  if (!visible || !provider || !connected) return null;

  const messageBuilder = MESSAGES[connected];
  if (!messageBuilder) return null;

  const providerLabel = PROVIDER_LABELS[provider] ?? provider;
  const tone = connected === "success" ? "success" : "error";

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
        tone === "success"
          ? "border-emerald-500/30 bg-emerald-600 text-white"
          : "border-rose-500/30 bg-rose-600 text-white"
      )}
    >
      {tone === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
      {messageBuilder(providerLabel)}
    </div>
  );
}
