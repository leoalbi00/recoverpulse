"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Activity, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

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
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500">
            <Activity className="size-4 text-zinc-950" strokeWidth={2.5} />
          </span>
          <span className="text-base font-semibold tracking-tight text-zinc-100">
            RecoverPulse
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Button render={<a href="/dashboard" />}>Dashboard</Button>
              <Button
                variant="ghost"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-zinc-400 hover:text-zinc-100"
              >
                Esci
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                render={<a href="/login" />}
                className="text-zinc-300 hover:text-zinc-100"
              >
                Accedi
              </Button>
              <Button render={<a href="/start-trial" />}>Inizia Prova</Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800/60 md:hidden"
          aria-label={open ? "Chiudi menu" : "Apri menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-zinc-800 bg-zinc-950/95 px-6 pt-2 pb-6 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {user ? (
              <>
                <Button render={<a href="/dashboard" onClick={() => setOpen(false)} />} className="w-full">
                  Dashboard
                </Button>
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
                <Button
                  variant="outline"
                  render={<a href="/login" onClick={() => setOpen(false)} />}
                  className="w-full"
                >
                  Accedi
                </Button>
                <Button
                  render={<a href="/register" onClick={() => setOpen(false)} />}
                  className="w-full"
                >
                  Registrati
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
