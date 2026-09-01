"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Activity,
  ArrowLeftRight,
  Bell,
  ChevronsUpDown,
  Code2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Receipt,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { isAdminEmail } from "@/lib/admin";
import { Switch } from "@/components/ui/switch";
import { NotificationBell } from "@/components/dashboard/notification-bell";

const DEV_VIEW_STORAGE_KEY = "recoverpulse:dev-view";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Notifiche", href: "/dashboard/notifiche", icon: Bell },
  {
    label: "Sequenze Dunning",
    href: "/dashboard/dunning",
    icon: MessagesSquare,
  },
  { label: "Transazioni", href: "/dashboard/transazioni", icon: Receipt },
  { label: "Impostazioni", href: "/dashboard/impostazioni", icon: Settings },
];

const DEVELOPER_NAV_ITEM = {
  label: "Sviluppatore",
  href: "/dashboard/developer",
  icon: Code2,
};

function maskAccountId(id: string): string {
  return id.length <= 4 ? id : `acct_••••${id.slice(-4)}`;
}

type SidebarProps = {
  user: { name?: string | null; email?: string | null };
  connectedStripeAccount: { stripeAccountId: string; livemode: boolean } | null;
};

function SidebarContent({
  user,
  connectedStripeAccount,
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isAdmin = isAdminEmail(user.email);

  // Preferenza puramente client-side: non è un controllo di sicurezza (la
  // pagina /dashboard/developer si autoprotegge lato server via isAdminEmail,
  // vedi src/app/dashboard/developer/page.tsx), serve solo a mostrare/
  // nascondere la voce di navigazione "Sviluppatore" senza affollare la
  // sidebar dell'unico account che ne ha bisogno.
  const [devView, setDevView] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    try {
      setDevView(window.localStorage.getItem(DEV_VIEW_STORAGE_KEY) === "true");
    } catch {
      // localStorage indisponibile (es. navigazione privata): resta in Vista Cliente
    }
  }, [isAdmin]);

  function toggleDevView(next: boolean) {
    setDevView(next);
    try {
      window.localStorage.setItem(DEV_VIEW_STORAGE_KEY, String(next));
    } catch {
      // vedi commento sopra
    }
  }

  const navItems = isAdmin && devView ? [...NAV_ITEMS, DEVELOPER_NAV_ITEM] : NAV_ITEMS;

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
        {navItems.map((item) => {
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

      <ProfileSwitcher
        user={user}
        isAdmin={isAdmin}
        devView={devView}
        onToggleDevView={toggleDevView}
        connectedStripeAccount={connectedStripeAccount}
      />
    </div>
  );
}

function ProfileSwitcher({
  user,
  isAdmin,
  devView,
  onToggleDevView,
  connectedStripeAccount,
}: {
  user: { name?: string | null; email?: string | null };
  isAdmin: boolean;
  devView: boolean;
  onToggleDevView: (next: boolean) => void;
  connectedStripeAccount: { stripeAccountId: string; livemode: boolean } | null;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative border-t border-zinc-800 p-4" ref={containerRef}>
      {open && (
        <div className="absolute bottom-full left-4 right-4 z-50 mb-2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
          <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
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

          {isAdmin && (
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100">
                    {devView ? "Vista Sviluppatore" : "Vista Cliente"}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    Richieste pilota e log di sistema
                  </p>
                </div>
              </div>
              <Switch
                checked={devView}
                onCheckedChange={onToggleDevView}
                aria-label="Attiva Vista Sviluppatore"
              />
            </div>
          )}

          <div className="px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <ArrowLeftRight className="size-3.5" />
              Cambia Profilo / Account
            </p>

            <div className="flex items-center gap-2.5 rounded-lg bg-zinc-800/60 px-3 py-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-medium text-emerald-400">
                {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-100">
                {user.name ?? user.email}
              </span>
              <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                Attivo
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-zinc-500">
              <CreditCard className="size-3.5 shrink-0" />
              {connectedStripeAccount ? (
                <span className="min-w-0 flex-1 truncate text-xs">
                  {maskAccountId(connectedStripeAccount.stripeAccountId)}
                  {connectedStripeAccount.livemode ? " · live" : " · test"}
                </span>
              ) : (
                <span className="text-xs">Nessun account Stripe collegato</span>
              )}
            </div>

            <p className="mt-2.5 text-[11px] text-zinc-600">
              Gestione multi-account in arrivo: qui potrai passare tra più profili RecoverPulse o account Stripe collegati.
            </p>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 border-t border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
          >
            <LogOut className="size-4" />
            Esci
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-zinc-800/60"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-medium text-emerald-400">
          {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-100">
            {user.name ?? "Utente"}
          </p>
          <p className="truncate text-xs text-zinc-400">{user.email}</p>
        </div>
        <ChevronsUpDown className="size-4 shrink-0 text-zinc-500" />
      </button>
    </div>
  );
}

export function DashboardSidebar({ user, connectedStripeAccount }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden border-r border-zinc-800 bg-zinc-900 md:fixed md:inset-y-0 md:z-40 md:flex md:w-64 md:flex-col">
        <SidebarContent user={user} connectedStripeAccount={connectedStripeAccount} />
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
            <SidebarContent
              user={user}
              connectedStripeAccount={connectedStripeAccount}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
