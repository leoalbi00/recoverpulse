"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { BETA_HEADLINE, BETA_SUBHEADLINE } from "@/lib/beta";

const NAV_LINKS = [
  { label: "Caratteristiche", href: "#features" },
  { label: "Calcola ROI", href: "#roi-calculator" },
  { label: "Prezzi", href: "#pricing" },
];

type NavbarProps = {
  user?: { name?: string | null; email?: string | null } | null;
};

export function Navbar({ user }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex items-center justify-center gap-1.5 border-b border-emerald-600/15 bg-emerald-50 px-4 py-1.5 text-center text-xs text-emerald-800">
        <span className="font-semibold">{BETA_HEADLINE}</span>
        <span className="hidden sm:inline">{BETA_SUBHEADLINE}</span>
      </div>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="OmniRev — home">
          <Logo animated={false} />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <a href="/dashboard" className={buttonVariants()}>Dashboard</a>
              <Button
                variant="ghost"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-muted-foreground hover:text-foreground"
              >
                Esci
              </Button>
            </>
          ) : (
            <>
              <a href="/login" className={cn(buttonVariants({ variant: "ghost" }), "text-slate-700 hover:text-foreground")}>
                Accedi
              </a>
              <a href="/start-trial" className={cn(buttonVariants(), "rounded-full px-4")}>
                Inizia gratis
              </a>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 items-center justify-center rounded-lg text-slate-700 hover:bg-muted md:hidden"
          aria-label={open ? "Chiudi menu" : "Apri menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background/95 px-6 pt-2 pb-6 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {user ? (
              <>
                <a href="/dashboard" onClick={() => setOpen(false)} className={cn(buttonVariants(), "w-full")}>
                  Dashboard
                </a>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full"
                >
                  Esci
                </Button>
              </>
            ) : (
              <>
                <a href="/login" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                  Accedi
                </a>
                <a href="/start-trial" onClick={() => setOpen(false)} className={cn(buttonVariants(), "w-full")}>
                  Inizia il recupero gratuito
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
