import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  id?: string;
  eyebrow: string;
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
};

/** Intestazione comune delle sezioni della landing: eyebrow, titolo, sottotitolo. */
export function SectionHeading({ id, eyebrow, icon: Icon, title, description, className }: SectionHeadingProps) {
  return (
    <div className={cn("mx-auto flex max-w-2xl flex-col items-center gap-4 text-center", className)}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-50/[0.03] px-3 py-1 text-xs font-medium text-zinc-300">
        {Icon && <Icon className="size-3.5 text-emerald-400" />}
        {eyebrow}
      </span>
      <h2 id={id} className="text-3xl font-semibold tracking-tight text-balance text-zinc-100 md:text-4xl">
        {title}
      </h2>
      {description && <p className="text-base leading-relaxed text-pretty text-zinc-400">{description}</p>}
    </div>
  );
}
