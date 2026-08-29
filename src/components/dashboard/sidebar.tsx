"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Activity,
  Bell,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessagesSquare,
  Receipt,
  Settings,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/dashboard/notification-bell";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Notifiche", href: "/dashboard/notifiche", icon: Bell },
  {
    label: "Sequenze Dunning",
    href: "/dashboard/sequenze",
    icon: MessagesSquare,
  },
  { label: "Modelli Email", href: "/dashboard/dunning", icon: Mail },
  { label: "Transazioni", href: "/dashboard/transazioni", icon: Receipt },
  { label: "Impostazioni", href: "/dashboard/impostazioni", icon: Settings },
];

type SidebarProps = {
  user: { name?: string | null; email?: string | null };
};

function SidebarContent({
  user,
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        className="flex items-center gap-2 px-6 py-5 transition-opacity hover:opacity-80"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500">
          <Activity className="size-4 text-zinc-950" strokeWidth={2.5} />
        </span>
        <span className="text-base font-bold tracking-tight text-zinc-100">
          RecoverPulse
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <a
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100",
              )}
            >
              <item.icon
                className={cn("size-4", isActive && "text-emerald-400")}
              />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-medium text-emerald-400">
            {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-100">
              {user.name ?? "Utente"}
            </p>
            <p className="truncate text-xs text-zinc-400">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
        >
          <LogOut className="size-4" />
          Esci
        </button>
      </div>
    </div>
  );
}

export function DashboardSidebar({ user }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden border-r border-zinc-800 bg-zinc-900 md:fixed md:inset-y-0 md:z-40 md:flex md:w-64 md:flex-col">
        <SidebarContent user={user} />
      </div>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 md:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500">
            <Activity className="size-4 text-zinc-950" strokeWidth={2.5} />
          </span>
          <span className="text-base font-semibold tracking-tight text-zinc-100">
            RecoverPulse
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800/60"
            aria-label="Apri menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/90"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-zinc-800 bg-zinc-900">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800/60"
              aria-label="Chiudi menu"
            >
              <X className="size-4" />
            </button>
            <SidebarContent user={user} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
