import { cn } from "@/lib/utils";

export function BentoGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6", className)}>{children}</div>;
}

type BentoCardProps = {
  /** Icona già renderizzata (es. `<RotateCw />`). */
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Etichetta opzionale accanto al titolo (es. "In arrivo"). */
  tag?: string;
  /** Piccola visualizzazione sotto al testo. */
  children?: React.ReactNode;
  className?: string;
};

/** Card della Bento Grid: superficie bianca con bordo sottile; all'hover si scurisce solo il bordo. */
export function BentoCard({ icon, title, description, tag, children, className }: BentoCardProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-xs transition-colors duration-200 hover:border-stone-300 md:p-8",
        className
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-200 [&_svg]:size-5 [&_svg]:text-emerald-700">
            {icon}
          </span>
          {tag && (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {tag}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {children && <div className="mt-auto">{children}</div>}
    </div>
  );
}
