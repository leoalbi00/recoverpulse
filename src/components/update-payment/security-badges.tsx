import { Lock, ShieldCheck } from "lucide-react";

/**
 * Badge di garanzia mostrati su ogni stato del portale /pay/[token] (form,
 * successo, errori) per rassicurare l'utente sulla sicurezza della transazione.
 */
export function SecurityBadges() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <ShieldCheck className="size-3.5 text-emerald-600" />
        Transazione sicura SSL a 256-bit
      </span>
      <span className="h-3 w-px bg-slate-300" aria-hidden />
      <span className="flex items-center gap-1.5">
        <Lock className="size-3.5 text-muted-foreground" />
        Powered by <span className="font-semibold text-slate-700">Stripe</span>
      </span>
    </div>
  );
}
