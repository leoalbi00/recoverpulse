"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Layers, Loader2, Trash2, X, Zap, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyField } from "@/components/dashboard/copy-field";
import { NotificationTypeIcon } from "@/components/dashboard/notification-type-icon";
import { broadcastNotificationsChanged } from "@/lib/notification-events";
import { NOTIFICATION_STYLES } from "@/lib/notification-style";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/lib/notifications";

type CategoryFilter = "all" | NotificationType;

const CATEGORIES: { value: CategoryFilter; label: string; Icon: LucideIcon; iconClass: string }[] = [
  { value: "all", label: "Tutte", Icon: Layers, iconClass: "text-zinc-400" },
  { value: "lead", label: "Lead", Icon: NOTIFICATION_STYLES.lead.Icon, iconClass: NOTIFICATION_STYLES.lead.iconClass },
  {
    value: "recovery",
    label: "Recuperi",
    Icon: NOTIFICATION_STYLES.recovery.Icon,
    iconClass: NOTIFICATION_STYLES.recovery.iconClass,
  },
  {
    value: "warning",
    label: "Sistema",
    Icon: NOTIFICATION_STYLES.warning.Icon,
    iconClass: NOTIFICATION_STYLES.warning.iconClass,
  },
];

type LeadMetadata = {
  name?: string;
  email?: string;
  company?: string;
  estimatedMrr?: string | null;
  message?: string | null;
};

type SimulateResult = { portalUrl: string; customerName: string; amountLabel: string };

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function NotificationsManager({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [leadModal, setLeadModal] = useState<Notification | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const [simulating, setSimulating] = useState(false);
  const [simulateResult, setSimulateResult] = useState<SimulateResult | null>(null);
  const [simulateError, setSimulateError] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (category === "all") return notifications;
    return notifications.filter((n) => n.type === category);
  }, [notifications, category]);

  function setPending(id: string, pending: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setPending(id, true);

    try {
      await fetch("/api/dashboard/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      broadcastNotificationsChanged();
    } finally {
      setPending(id, false);
    }
  }

  async function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    await fetch("/api/dashboard/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    broadcastNotificationsChanged();
  }

  async function deleteOne(id: string) {
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setLeadModal((current) => (current?.id === id ? null : current));
    setPending(id, true);

    try {
      const response = await fetch("/api/dashboard/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("delete failed");
      broadcastNotificationsChanged();
    } catch {
      setNotifications(previous);
    } finally {
      setPending(id, false);
    }
  }

  function openLead(notification: Notification) {
    setLeadModal(notification);
    if (!notification.read) markAsRead(notification.id);
  }

  async function simulateFailedPayment() {
    setSimulating(true);
    setSimulateError(null);
    setSimulateResult(null);

    try {
      const response = await fetch("/api/test/generate-failed-payment", { method: "POST" });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setSimulateError(data?.error ?? "Impossibile generare la transazione di prova.");
        return;
      }

      const amountLabel = new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: String(data.transaction?.currency ?? "eur").toUpperCase(),
      }).format((data.transaction?.amount ?? 0) / 100);

      setSimulateResult({
        portalUrl: data.portalUrl,
        customerName: data.transaction?.customerName ?? "Cliente di test",
        amountLabel,
      });
    } catch {
      setSimulateError("Impossibile contattare RecoverPulse. Riprova.");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 ring-1 ring-amber-400/20">
              <Zap className="size-4 text-amber-400" />
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-100">Simula Pagamento Fallito</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Genera una fattura di test (TechCorp, €199) e il link al portale di recupero.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={simulating}
            onClick={simulateFailedPayment}
            className="w-full shrink-0 sm:w-auto"
          >
            {simulating ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
            {simulating ? "Generazione…" : "Simula Pagamento Fallito"}
          </Button>
        </div>

        {simulateError && <p className="mt-4 text-xs text-rose-500">{simulateError}</p>}

        {simulateResult && (
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs text-zinc-400">
              Transazione creata per <span className="text-zinc-200">{simulateResult.customerName}</span> ·{" "}
              {simulateResult.amountLabel}
            </p>
            <div className="mt-2.5">
              <CopyField value={simulateResult.portalUrl} />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                category === item.value
                  ? "border-zinc-700 bg-zinc-800/80 text-zinc-100"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100"
              )}
            >
              <item.Icon className={cn("size-3.5 shrink-0", item.iconClass)} />
              {item.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={markAllAsRead} className="self-start sm:self-auto">
            <Check className="size-3.5" />
            Segna tutte come lette
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 shadow-xl shadow-black/20 backdrop-blur-sm">
        {filtered.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-zinc-500">
            {notifications.length === 0 ? "Nessuna notifica al momento." : "Nessuna notifica in questa categoria."}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800/60">
            {filtered.map((notification) => {
              const style = NOTIFICATION_STYLES[notification.type];
              const isLead = notification.type === "lead";
              const isPending = pendingIds.has(notification.id);

              return (
                <li
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 border-l-4 px-5 py-4",
                    notification.read ? "border-l-transparent" : cn(style.borderClass, style.tintClass)
                  )}
                >
                  <NotificationTypeIcon type={notification.type} className="mt-0.5" />

                  <button
                    type="button"
                    disabled={!isLead}
                    onClick={() => isLead && openLead(notification)}
                    className={cn("min-w-0 flex-1 text-left", isLead && "cursor-pointer")}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-zinc-400">{style.label}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-auto px-1.5 py-0 text-[10px]",
                          notification.read
                            ? "border-zinc-700 text-zinc-500"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                        )}
                      >
                        {notification.read ? "Letta" : "Non letta"}
                      </Badge>
                      {isLead && <span className="text-[11px] text-indigo-400">Vedi dettagli →</span>}
                    </div>
                    <p className={cn("mt-1 text-sm", notification.read ? "text-zinc-400" : "text-zinc-100")}>
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">{formatDateTime(notification.createdAt)}</p>
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    {!notification.read && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={isPending}
                        onClick={() => markAsRead(notification.id)}
                        aria-label="Segna come letta"
                        title="Segna come letta"
                      >
                        <Check className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => deleteOne(notification.id)}
                      aria-label="Elimina notifica"
                      title="Elimina notifica"
                      className="hover:text-rose-500"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {leadModal && <LeadDetailModal notification={leadModal} onClose={() => setLeadModal(null)} />}
    </div>
  );
}

function LeadDetailModal({ notification, onClose }: { notification: Notification; onClose: () => void }) {
  const metadata = (notification.metadata ?? {}) as LeadMetadata;
  const hasDetails = Boolean(metadata.name || metadata.email || metadata.company);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/60"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <NotificationTypeIcon type="lead" />
            <div>
              <p className="text-xs font-medium text-indigo-400">Nuovo Lead</p>
              <h3 className="mt-0.5 text-lg font-semibold text-zinc-100">Richiesta pilota</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200"
            aria-label="Chiudi"
          >
            <X className="size-4" />
          </button>
        </div>

        {hasDetails ? (
          <dl className="mt-5 flex flex-col gap-3 text-sm">
            <DetailRow label="Nome" value={metadata.name} />
            <DetailRow label="Email" value={metadata.email} />
            <DetailRow label="Azienda" value={metadata.company} />
            <DetailRow label="MRR stimato" value={metadata.estimatedMrr} />
            <DetailRow label="Messaggio" value={metadata.message} multiline />
          </dl>
        ) : (
          <p className="mt-5 text-sm text-zinc-400">{notification.message}</p>
        )}

        {!hasDetails && (
          <p className="mt-3 text-xs text-zinc-500">
            Dettagli del modulo non disponibili per questa notifica (generata prima dell&apos;introduzione della
            scheda lead).
          </p>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, multiline = false }: { label: string; value?: string | null; multiline?: boolean }) {
  const displayValue = value && value.trim().length > 0 ? value : "—";
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className={cn("mt-0.5 text-zinc-200", multiline && "whitespace-pre-wrap")}>{displayValue}</dd>
    </div>
  );
}
