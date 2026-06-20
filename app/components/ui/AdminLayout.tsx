import { useNavigate, useLocation } from "react-router";
import { getStoredAdmin, clearAdminSession } from "~/services/adminAuth";
import AdminRoute from "./AdminRoute";

const NAV = [
  { path: "/admin",           label: "Dashboard",  icon: "⊞",  exact: true },
  { path: "/admin/usuarios",  label: "Usuarios",   icon: "👥" },
  { path: "/admin/partidos",  label: "Partidos",   icon: "🏓" },
  { path: "/admin/metricas",  label: "Métricas",   icon: "📊" },
  { path: "/admin/auditoria", label: "Auditoría",  icon: "📋" },
  { path: "/admin/backup",    label: "Respaldo",   icon: "💾" },
];

const SIDEBAR_W = 220;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const admin    = getStoredAdmin();

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  };

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <AdminRoute>
      {/* Ocupa toda la pantalla, ignora el flex-center del root */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999, display: "flex", fontFamily: "'DM Sans', sans-serif",
        background: "#131620",
      }}>

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside style={{
          width: SIDEBAR_W, flexShrink: 0,
          background: "#0c0e16",
          borderRight: "1px solid #1e2130",
          display: "flex", flexDirection: "column",
          overflowY: "auto",
        }}>
          {/* Brand */}
          <div
            onClick={() => navigate("/admin")}
            style={{
              padding: "22px 20px 18px",
              cursor: "pointer", userSelect: "none",
              borderBottom: "1px solid #1e2130",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>🛡️</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#84cc16", letterSpacing: "-0.3px" }}>
                  PadelHub
                </div>
                <div style={{ fontSize: 11, color: "#4b5563", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Admin Panel
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: "12px 10px", flex: 1 }}>
            {NAV.map(({ path, label, icon, exact }) => {
              const active = isActive(path, exact);
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", marginBottom: 2,
                    background: active ? "rgba(132,204,22,0.12)" : "transparent",
                    border: "none",
                    borderLeft: active ? "3px solid #84cc16" : "3px solid transparent",
                    borderRadius: 8, cursor: "pointer",
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? "#84cc16" : "#9ca3af",
                    textAlign: "left", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLElement).style.color = "#e5e7eb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#9ca3af";
                    }
                  }}
                >
                  <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{icon}</span>
                  {label}
                </button>
              );
            })}
          </nav>

          {/* User card */}
          <div style={{
            padding: "16px 14px", borderTop: "1px solid #1e2130",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: "rgba(132,204,22,0.15)", border: "2px solid #84cc16",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#84cc16",
            }}>
              {(admin?.name ?? "A")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {admin?.name ?? "Admin"}
              </div>
              <div style={{ fontSize: 11, color: "#84cc16", fontWeight: 500 }}>Administrador</div>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 16, color: "#6b7280", padding: 4, borderRadius: 6,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}
            >
              ⏻
            </button>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────── */}
        <main style={{
          flex: 1, overflowY: "auto",
          background: "#131620",
        }}>
          {children}
        </main>
      </div>
    </AdminRoute>
  );
}
