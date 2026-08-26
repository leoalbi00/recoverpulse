import { AlertTriangle, CheckCircle2, UserPlus, type LucideIcon } from "lucide-react";

import type { NotificationType } from "@/lib/notifications";

export type NotificationStyle = {
  label: string;
  Icon: LucideIcon;
  /** Riquadro arrotondato colorato dietro l'icona. */
  iconBoxClass: string;
  iconClass: string;
  /** Accento a sinistra della riga/card della notifica. */
  borderClass: string;
  /** Sfumatura di sfondo abbinata all'accento. */
  tintClass: string;
  /** Pallino pieno usato nei filtri per categoria. */
  dotClass: string;
};

// Avvisi/pagamenti falliti -> rosso, recuperi -> verde, lead -> indaco:
// stesso codice colore ovunque una notifica compaia (campanella, pagina
// /dashboard/notifiche, modale di dettaglio lead).
export const NOTIFICATION_STYLES: Record<NotificationType, NotificationStyle> = {
  warning: {
    label: "Avviso",
    Icon: AlertTriangle,
    iconBoxClass: "bg-red-500/15 ring-1 ring-red-500/30",
    iconClass: "text-red-400",
    borderClass: "border-l-red-500",
    tintClass: "bg-red-950/30",
    dotClass: "bg-red-500",
  },
  recovery: {
    label: "Recupero",
    Icon: CheckCircle2,
    iconBoxClass: "bg-emerald-500/15 ring-1 ring-emerald-500/30",
    iconClass: "text-emerald-400",
    borderClass: "border-l-emerald-500",
    tintClass: "bg-emerald-950/20",
    dotClass: "bg-emerald-500",
  },
  lead: {
    label: "Nuovo Lead",
    Icon: UserPlus,
    iconBoxClass: "bg-indigo-500/15 ring-1 ring-indigo-500/30",
    iconClass: "text-indigo-400",
    borderClass: "border-l-indigo-500",
    tintClass: "bg-indigo-950/20",
    dotClass: "bg-indigo-500",
  },
};
