import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useNotifications, type Notification } from "~/context/NotificationsContext";
import NavBar from "~/components/ui/NavBar";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const DISMISS_THRESHOLD = 90;

// Desliza hacia la derecha para descartar: mientras se arrastra, la fila
// se mueve con el dedo; al soltar, si paso el umbral se anima hacia afuera
// y colapsa su alto (asi la de abajo "sube" a ocupar el lugar) antes de
// sacarla del estado.
function SwipeableRow({ children, onDismiss }: { children: React.ReactNode; onDismiss: () => void }) {
  const [dragX, setDragX] = useState(0);
  const [phase, setPhase] = useState<"idle" | "dragging" | "leaving">("idle");
  const startX = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    setPhase("dragging");
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    if (delta > 0) setDragX(delta);
  };
  const handlePointerUp = () => {
    if (startX.current === null) return;
    startX.current = null;
    if (dragX > DISMISS_THRESHOLD) {
      setPhase("leaving");
      setDragX(600);
      setTimeout(onDismiss, 220);
    } else {
      setPhase("idle");
      setDragX(0);
    }
  };

  return (
    <div
      style={{
        maxHeight: phase === "leaving" ? 0 : 200,
        opacity: phase === "leaving" ? 0 : 1,
        overflow: "hidden",
        transition: "max-height 0.22s ease 0.05s, opacity 0.2s ease",
      }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: phase === "dragging" ? "none" : "transform 0.2s ease",
          touchAction: "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function NotificationRow({ n, i, total, onClick }: { n: Notification; i: number; total: number; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", gap: 12, padding: "14px 16px",
        background: n.read ? "transparent" : "rgba(132,204,22,0.06)",
        borderBottom: i < total - 1 ? "1px solid var(--border)" : "none",
        cursor: n.read ? "default" : "pointer",
      }}
    >
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        marginTop: 6, flexShrink: 0,
        background: n.read ? "transparent" : "var(--accent)",
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14,
          fontWeight: n.read ? 400 : 600,
          marginBottom: n.body ? 3 : 0,
        }}>
          {n.title}
        </div>
        {n.body && (
          <div style={{ fontSize: 13, color: "var(--text2)" }}>{n.body}</div>
        )}
      </div>
      <div style={{
        fontSize: 11, color: "var(--text2)",
        flexShrink: 0, marginTop: 2,
      }}>
        {timeAgo(n.created_at)}
      </div>
    </div>
  );
}

export default function Notificaciones() {
  const navigate = useNavigate();
  const { notifications: notifs, unreadCount, loading, markAllRead, markRead, dismiss } = useNotifications();

  return (
    <div className="ph-screen">
      <div className="ph-scroll" style={{ padding: "0 0 16px" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 20px 16px",
        }}>
          <button className="ph-back-btn" onClick={() => navigate(-1)}>←</button>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>
            Notificaciones
          </div>
          {unreadCount > 0 ? (
            <button
              onClick={markAllRead}
              style={{
                fontSize: 12, color: "var(--accent)",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontWeight: 600,
              }}
            >
              Leer todo
            </button>
          ) : (
            <div style={{ width: 60 }} />
          )}
        </div>

        <div style={{ padding: "0 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text2)", fontSize: 14 }}>
              Cargando...
            </div>
          ) : notifs.length === 0 ? (
            <div className="ph-card" style={{ textAlign: "center", padding: "36px 16px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Sin notificaciones</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>
                Aquí aparecerán tus alertas de partidos
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>
                Desliza hacia la derecha para descartar
              </div>
              <div className="ph-card" style={{ padding: 0, overflow: "hidden" }}>
                {notifs.map((n, i) => (
                  <SwipeableRow key={n.id} onDismiss={() => dismiss(n.id)}>
                    <NotificationRow
                      n={n} i={i} total={notifs.length}
                      onClick={() => { if (!n.read) markRead(n.id); }}
                    />
                  </SwipeableRow>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
      <NavBar />
    </div>
  );
}
