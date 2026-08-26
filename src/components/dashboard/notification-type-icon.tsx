import { NOTIFICATION_STYLES } from "@/lib/notification-style";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/lib/notifications";

export function NotificationTypeIcon({
  type,
  className,
  iconClassName,
}: {
  type: NotificationType;
  className?: string;
  iconClassName?: string;
}) {
  const style = NOTIFICATION_STYLES[type];
  const Icon = style.Icon;

  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-lg p-2", style.iconBoxClass, className)}>
      <Icon className={cn("size-4", style.iconClass, iconClassName)} />
    </span>
  );
}
