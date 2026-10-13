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
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        {Icon && <Icon className="size-4" />}
        {eyebrow}
      </span>
      <h2 id={id} className="text-3xl font-semibold tracking-tight text-balance text-foreground md:text-4xl">
        {title}
      </h2>
      {description && <p className="text-base leading-relaxed text-pretty text-muted-foreground md:text-lg">{description}</p>}
    </div>
  );
}
