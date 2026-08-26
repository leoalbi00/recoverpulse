// Ponte leggero tra la campanella nell'header (montata una volta nel layout
// della dashboard) e i pannelli che modificano le notifiche altrove (es.
// /dashboard/notifiche): un CustomEvent sul window evita di introdurre un
// context/state manager globale solo per tenere sincronizzato il badge.
const NOTIFICATIONS_CHANGED_EVENT = "recoverpulse:notifications-changed";

export function broadcastNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

export function onNotificationsChanged(callback: () => void): () => void {
  window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, callback);
  return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, callback);
}
