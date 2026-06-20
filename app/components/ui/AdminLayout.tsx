import { useNavigate, useLocation } from "react-router";
import { getStoredAdmin, clearAdminSession } from "~/services/adminAuth";
import AdminRoute from "./AdminRoute";

const NAV = [
  { path: "/admin/usuarios",  label: "Usuarios",  icon: "👥" },
  { path: "/admin/partidos",  label: "Partidos",  icon: "🏓" },
  { path: "/admin/backup",    label: "Respaldo",  icon: "💾" },
  { path: "/admin/metricas",  label: "Métricas",  icon: "📊" },
  { path: "/admin/auditoria", label: "Auditoría", icon: "📋" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const admin    = getStoredAdmin();

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  };

  return (
    <AdminRoute>
      <div style={{ width: "100%", alignSelf: "stretch", minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)", display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <header style={{
          display: "flex", alignItems: "center", gap: 0,
          height: 56, padding: "0 32px",
          background: "var(--bg2)", borderBottom: "2px solid var(--border)",
          position: "sticky", top: 0, zIndex: 100,
        }}>

          {/* Brand */}
          <div
            onClick={() => navigate("/admin")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              cursor: "pointer", marginRight: 40, userSelect: "none",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 20 }}>🛡️</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: "var(--accent)", letterSpacing: "-0.3px" }}>
              PadelHub
            </span>
            <span style={{ fontWeight: 400, fontSize: 14, color: "var(--text2)", marginLeft: 2 }}>
              Admin
            </span>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", gap: 2, flex: 1 }}>
            {NAV.map(({ path, label, icon }) => {
              const active = location.pathname === path || location.pathname.startsWith(path.replace(/s$/, '/'));
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  style={{
                    background: active ? "rgba(132,204,22,0.12)" : "none",
                    border: "none",
                    borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                    borderRadius: 0,
                    height: 56,
                    padding: "0 18px",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? "var(--accent)" : "var(--text2)",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 7,
                    transition: "color 0.15s, background 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"; }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--text2)"; }}
                >
                  <span style={{ fontSize: 15 }}>{icon}</span>
                  {label}
                </button>
              );
            })}
          </nav>

          {/* User info + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(132,204,22,0.15)",
              border: "2px solid var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "var(--accent)",
            }}>
              {(admin?.name ?? "A")[0].toUpperCase()}
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{admin?.name ?? "Admin"}</div>
              <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Administrador
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: "none", border: "1px solid var(--border)",
                borderRadius: 8, padding: "6px 16px",
                fontSize: 12, color: "var(--text2)", cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text2)"; }}
            >
              Salir
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </AdminRoute>
  );
}
