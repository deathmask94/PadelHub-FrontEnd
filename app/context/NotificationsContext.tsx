import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { apiFetch } from "~/services/auth";
import { registerPushNotifications } from "~/services/push";

export interface Notification {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAllRead: () => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

const POLL_INTERVAL_MS = 5000;

export function NotificationsProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  // Evita pisar un "marcar todo leído" optimista con una respuesta de polling en vuelo
  const markingRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<{ notifications: Notification[]; unread_count: number }>(
        "/api/notifications"
      );
      if (!markingRef.current) setNotifications(data.notifications);
    } catch {
      // Silencioso: un fallo puntual no debe interrumpir el polling
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh();
    registerPushNotifications();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  const markAllRead = () => {
    markingRef.current = true;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    apiFetch("/api/notifications", { method: "PATCH" })
      .catch(() => {})
      .finally(() => { markingRef.current = false; });
  };

  const markRead = (id: string) => {
    markingRef.current = true;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    apiFetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ id }) })
      .catch(() => {})
      .finally(() => { markingRef.current = false; });
  };

  // Swipe para descartar: borrado real (no solo "leida"), asi que se saca
  // del estado local de una y no se vuelve a mostrar aunque llegue el
  // proximo polling antes de que la respuesta del DELETE vuelva.
  const dismiss = (id: string) => {
    markingRef.current = true;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    apiFetch(`/api/notifications?id=${id}`, { method: "DELETE" })
      .catch(() => {})
      .finally(() => { markingRef.current = false; });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading, refresh, markAllRead, markRead, dismiss }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications debe usarse dentro de NotificationsProvider");
  return ctx;
}
