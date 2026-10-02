import { cn } from "@/lib/utils";

type GridPatternProps = {
  /** Lato della cella in px. */
  size?: number;
  /** Maschera radiale: dove la griglia resta visibile prima di sfumare. */
  mask?: string;
  className?: string;
};

/**
 * Griglia geometrica di sfondo, solo CSS: linee sottili a bassa opacità con
 * una maschera radiale che le dissolve verso i bordi, così il testo sopra
 * resta nitido. Va dentro un contenitore `relative`; non intercetta eventi.
 */
export function GridPattern({
  size = 48,
  mask = "radial-gradient(ellipse 70% 60% at 50% 0%, black 30%, transparent 75%)",
  className,
}: GridPatternProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
      style={{
        backgroundImage:
          "linear-gradient(to right, rgb(255 255 255 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.05) 1px, transparent 1px)",
        backgroundSize: `${size}px ${size}px`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}
