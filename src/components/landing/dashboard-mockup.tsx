import { Bell, ShieldCheck, TrendingUp } from "lucide-react";

// Anteprima statica della dashboard usata dalla Hero in scrollytelling
// (hero-scroll.tsx): solo markup e Tailwind, nessuna immagine.
const MOCK_TRANSACTIONS = [
  { name: "Nova Studio SRL", amount: "€89,00", status: "recuperato" as const },
  { name: "Blue Ocean Agency", amount: "€199,00", status: "in_corso" as const },
  { name: "Marco Rossi Consulting", amount: "€39,00", status: "in_corso" as const },
];

const AVATAR_STYLES = [
  "bg-emerald-500/15 text-emerald-400",
  "bg-sky-500/15 text-sky-400",
  "bg-violet-500/15 text-violet-400",
];

const STATUS_STYLES = {
  recuperato: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  in_corso: "bg-amber-400/10 text-amber-400 ring-amber-400/20",
};

const STATUS_LABEL = {
  recuperato: "Recuperato",
  in_corso: "In corso",
};

export function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full py-6">
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-emerald-500/10 blur-3xl"
      />

      {/* Carta "fantasma" leggermente ruotata dietro la carta principale, per
          dare un effetto di profondità a strati senza usare immagini. */}
      <div
        aria-hidden
        className="absolute inset-x-5 top-8 bottom-2 -z-10 rotate-2 rounded-2xl border border-zinc-800/60 bg-zinc-900/40"
      />

      <div className="-rotate-1 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/50 backdrop-blur-sm transition-transform duration-500 ease-out hover:rotate-0">
        <div className="flex items-center gap-1.5 border-b border-zinc-800 bg-zinc-950/60 px-4 py-3">
          <span className="size-2.5 rounded-full bg-zinc-700" />
          <span className="size-2.5 rounded-full bg-zinc-700" />
          <span className="size-2.5 rounded-full bg-zinc-700" />
          <span className="ml-3 truncate text-xs text-zinc-500">omnirev.app/dashboard</span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-[10px] text-zinc-500">Recuperato</p>
              <p className="mt-1 text-sm font-semibold text-zinc-100 sm:text-base">€12.480</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-[10px] text-zinc-500">Tasso Recupero</p>
              <p className="mt-1 text-sm font-semibold text-emerald-400 sm:text-base">68%</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-[10px] text-zinc-500">In Recupero</p>
              <p className="mt-1 text-sm font-semibold text-zinc-100 sm:text-base">14</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex items-end gap-1.5 sm:gap-2">
              {[40, 65, 45, 80, 60, 95, 70, 85, 55, 90, 75, 100].map((height, index) => (
                <div key={index} className="flex-1">
                  <div
                    className="rounded-t bg-gradient-to-t from-emerald-500/80 to-emerald-400"
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
                className="flex items-center gap-2.5 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2"
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${AVATAR_STYLES[index % AVATAR_STYLES.length]}`}
                >
                  {tx.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-300">{tx.name}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-zinc-400">{tx.amount}</span>
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
        <div className="flex items-center gap-3 border-t border-zinc-800 bg-zinc-950/60 px-5 py-4">
          <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-emerald-400 -top-0.5 -right-0.5" />
            <span className="absolute size-2 rounded-full bg-emerald-400 -top-0.5 -right-0.5" />
            <ShieldCheck className="size-4 text-emerald-400" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] text-zinc-500">Automazione</p>
            <p className="truncate text-sm font-semibold text-zinc-100">
              Attiva su Email <span className="text-zinc-500">· SMS/WhatsApp Pro</span>
            </p>
          </div>
        </div>
      </div>

      {/* Badge fluttuanti fuori dalla carta: rinforzano il messaggio
          "recupero automatico" con un tocco di profondità, senza immagini. */}
      <div className="absolute top-2 -right-2 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-zinc-900 px-3.5 py-2.5 shadow-xl shadow-black/40 sm:-right-6">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
          <TrendingUp className="size-3.5 text-emerald-400" />
        </span>
        <div className="leading-tight">
          <p className="text-[10px] text-zinc-500">Questo mese</p>
          <p className="text-xs font-semibold text-zinc-100">+€3.240 recuperati</p>
        </div>
      </div>

      <div className="absolute -bottom-2 -left-2 hidden items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 shadow-xl shadow-black/40 sm:-left-6 sm:flex">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-400/15">
          <Bell className="size-3.5 text-amber-400" />
        </span>
        <div className="leading-tight">
          <p className="text-[10px] text-zinc-500">Sollecito inviato</p>
          <p className="text-xs font-semibold text-zinc-100">Blue Ocean Agency</p>
        </div>
      </div>
    </div>
  );
}
