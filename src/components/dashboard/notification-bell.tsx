"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";
import { broadcastNotificationsChanged, onNotificationsChanged } from "@/lib/notification-events";
import { NOTIFICATION_STYLES } from "@/lib/notification-style";
import { NotificationTypeIcon } from "@/components/dashboard/notification-type-icon";
import type { Notification } from "@/lib/notifications";

const BELL_PREVIEW_LIMIT = 8;

const POLL_INTERVAL_MS = 30_000;

function formatRelativeTime(iso: string): string {
  const diffMinutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diffMinutes < 1) return "adesso";
  if (diffMinutes < 60) return `${diffMinutes} min fa`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "ora" : "ore"} fa`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? "giorno" : "giorni"} fa`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/dashboard/notifications?limit=${BELL_PREVIEW_LIMIT}`);
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silenzioso: il badge resta invariato finché il prossimo poll non riesce
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => onNotificationsChanged(load), [load]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch("/api/dashboard/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      broadcastNotificationsChanged();
    } catch {
      load();
    }
  }

  async function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/dashboard/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      broadcastNotificationsChanged();
    } catch {
      load();
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={unreadCount > 0 ? `Notifiche (${unreadCount} non lette)` : "Notifiche"}
        className="relative flex size-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && <span className="absolute top-1 right-1 size-2.5 animate-pulse rounded-full bg-red-500" />}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl shadow-black/60 sm:w-96">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-100">Notifiche</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-emerald-500 hover:text-emerald-400"
              >
                Segna tutte come lette
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">Caricamento…</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">Nessuna notifica.</p>
            ) : (
              notifications.map((notification) => {
                const style = NOTIFICATION_STYLES[notification.type];
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => !notification.read && markAsRead(notification.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-l-4 border-zinc-800/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-zinc-800/40",
                      notification.read ? "border-l-transparent" : cn(style.borderClass, style.tintClass)
                    )}
                  >
                    <NotificationTypeIcon type={notification.type} />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-zinc-400">{style.label}</span>
                      <p className={cn("mt-0.5 text-sm", notification.read ? "text-zinc-400" : "text-zinc-100")}>
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">{formatRelativeTime(notification.createdAt)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <Link
            href="/dashboard/notifiche"
            onClick={() => setOpen(false)}
            className="block border-t border-zinc-800 px-4 py-2.5 text-center text-xs font-medium text-emerald-500 hover:bg-zinc-800/40 hover:text-emerald-400"
          >
            Vedi tutte
          </Link>
        </div>
      )}
    </div>
  );
}
