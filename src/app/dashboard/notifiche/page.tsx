import { listNotifications } from "@/lib/notifications";
import { NotificationsManager } from "@/components/dashboard/notifications-manager";

export default async function NotifichePage() {
  const notifications = await listNotifications(200);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Notifiche
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          Nuovi lead pilota, pagamenti recuperati e avvisi di sistema, in un unico posto.
        </p>
      </div>

      <div className="mt-8">
        <NotificationsManager initialNotifications={notifications} />
      </div>
    </main>
  );
}
