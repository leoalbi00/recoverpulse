import { ShieldCheck } from "lucide-react";

// Anteprima statica e piatta della dashboard usata dalla Hero
// (hero.tsx): solo markup e Tailwind, nessuna immagine.
const MOCK_TRANSACTIONS = [
  { name: "Nova Studio SRL", amount: "€89,00", status: "recuperato" as const },
  { name: "Blue Ocean Agency", amount: "€199,00", status: "in_corso" as const },
  { name: "Marco Rossi Consulting", amount: "€39,00", status: "in_corso" as const },
];

const AVATAR_STYLES = ["bg-emerald-50 text-emerald-800", "bg-sky-50 text-sky-800", "bg-stone-100 text-stone-700"];

const STATUS_STYLES = {
  recuperato: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  in_corso: "bg-amber-50 text-amber-800 ring-amber-200",
};

const STATUS_LABEL = {
  recuperato: "Recuperato",
  in_corso: "In corso",
};

export function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_48px_-24px_rgb(28_25_23/0.18)]">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted px-4 py-3">
        <span className="size-2.5 rounded-full bg-stone-300" />
        <span className="size-2.5 rounded-full bg-stone-300" />
        <span className="size-2.5 rounded-full bg-stone-300" />
        <span className="ml-3 truncate text-xs text-stone-500">omnirev.app/dashboard</span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-[10px] text-stone-500">Recuperato</p>
            <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">€12.480</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[10px] text-stone-500">Tasso Recupero</p>
            <p className="mt-1 text-sm font-semibold text-emerald-700 sm:text-base">68%</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[10px] text-stone-500">In Recupero</p>
            <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">14</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border p-4">
          <div className="flex items-end gap-1.5 sm:gap-2">
            {[40, 65, 45, 80, 60, 95, 70, 85, 55, 90, 75, 100].map((height, index) => (
              <div key={index} className="flex-1">
                <div
                  className="rounded-t bg-emerald-600/85"
                  style={{ height: `${height * 0.4}px` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {MOCK_TRANSACTIONS.map((tx, index) => (
            <div
              key={tx.name}
              className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2"
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${AVATAR_STYLES[index % AVATAR_STYLES.length]}`}
              >
                {tx.name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{tx.name}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">{tx.amount}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${STATUS_STYLES[tx.status]}`}
                >
                  {STATUS_LABEL[tx.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer interno, nel normale flusso del documento: non è un
          elemento "absolute" fluttuante, quindi non può mai sovrapporsi
          alla lista transazioni qui sopra a nessuna larghezza di schermo. */}
      <div className="flex items-center gap-3 border-t border-border bg-muted px-5 py-4">
        <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-emerald-200">
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-600 ring-2 ring-white" />
          <ShieldCheck className="size-4 text-emerald-700" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] text-stone-500">Automazione</p>
          <p className="truncate text-sm font-semibold text-foreground">
            Attiva su Email <span className="text-stone-500">· SMS/WhatsApp Pro</span>
          </p>
        </div>
      </div>
    </div>
  );
}
