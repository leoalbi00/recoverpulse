import { Sparkles } from "lucide-react";

const UPCOMING_CHANNELS = ["PayPal", "Klarna", "Mollie", "Fatturazione Elettronica"];

export function RoadmapBadge() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-4">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-zinc-900/60 to-zinc-900/60 px-6 py-5 text-center sm:flex-row sm:justify-center sm:text-left">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
          <Sparkles className="size-4 text-emerald-400" />
        </span>
        <p className="text-sm text-zinc-300">
          <span className="font-semibold text-emerald-300">In arrivo:</span>{" "}
          Recupero automatico anche per{" "}
          {UPCOMING_CHANNELS.map((channel, index) => (
            <span key={channel}>
              <span className="font-medium text-zinc-100">{channel}</span>
              {index < UPCOMING_CHANNELS.length - 2
                ? ", "
                : index === UPCOMING_CHANNELS.length - 2
                  ? " e "
                  : ""}
            </span>
          ))}
          .
        </p>
      </div>
    </section>
  );
}
