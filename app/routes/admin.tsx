import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AdminRoute from "~/components/ui/AdminRoute";
import { getStoredAdmin, clearAdminSession } from "~/services/adminAuth";

export default function AdminDashboardPage() {
  const navigate  = useNavigate();
  const admin     = getStoredAdmin();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Actualiza el reloj cada minuto para mostrar sesión activa
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Escucha expiración de sesión admin
  useEffect(() => {
    const handler = () => { navigate("/admin/login", { replace: true }); };
    window.addEventListener("padelhub:admin-session-expired", handler);
    return () => window.removeEventListener("padelhub:admin-session-expired", handler);
  }, [navigate]);

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  };

  return (
    <AdminRoute>
      <div style={{
        minHeight: "100vh", background: "var(--bg)",
        fontFamily: "var(--font-body)",
      }}>
        {/* Navbar */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 24px",
          background: "var(--bg2)", borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--accent)" }}>
              PadelHub Admin
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>
              {admin?.name ?? "Admin"}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: "none", border: "1px solid var(--border)",
                borderRadius: 8, padding: "6px 14px",
                fontSize: 12, color: "var(--text2)", cursor: "pointer",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Main */}
        <main style={{ padding: "28px 48px" }}>
          {/* Info de sesión */}
          <div style={{
            background: "rgba(132,204,22,0.06)", border: "1px solid var(--border2)",
            borderRadius: 12, padding: "16px 20px", marginBottom: 28,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Sesión activa</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                Sesión válida por 4 horas · {now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div style={{
              background: "rgba(132,204,22,0.12)", border: "1px solid var(--accent)",
              borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "var(--accent)", fontWeight: 600,
            }}>
              ADMIN
            </div>
          </div>

          {/* Tarjetas de acceso rápido */}
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text2)", marginBottom: 14 }}>
            PANEL DE CONTROL
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {[
              { icon: "👥", title: "Usuarios",  desc: "Ver y gestionar jugadores",  disabled: false, path: "/admin/usuarios" },
              { icon: "🏓", title: "Partidos",  desc: "Supervisar partidos activos", disabled: false, path: "/admin/partidos"    },
              { icon: "💾", title: "Respaldo",   desc: "Backup e importación de BD",  disabled: false, path: "/admin/backup"      },
              { icon: "📊", title: "Métricas",  desc: "Estadísticas de la plataforma", disabled: false, path: "/admin/metricas"  },
              { icon: "📋", title: "Auditoría", desc: "Registros de acceso admin",   disabled: false, path: "/admin/auditoria"  },
            ].map(({ icon, title, desc, disabled, path }) => (
              <div
                key={title}
                onClick={() => { if (!disabled && path) navigate(path); }}
                style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: "20px 16px",
                  opacity: disabled ? 0.45 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!disabled) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>{desc}</div>
                {disabled && (
                  <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 8 }}>Próximamente</div>
                )}
              </div>
            ))}
          </div>

          {/* Info del admin */}
          <div style={{
            marginTop: 32, background: "var(--bg3)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "16px 20px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 10 }}>
              INFORMACIÓN DE CUENTA
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
              <div><span style={{ color: "var(--text2)" }}>Nombre: </span>{admin?.name}</div>
              <div><span style={{ color: "var(--text2)" }}>Email: </span>{admin?.email ?? "—"}</div>
              <div><span style={{ color: "var(--text2)" }}>RUT: </span>{admin?.rut}-{admin?.dv_rut}</div>
              <div><span style={{ color: "var(--text2)" }}>Rol: </span>{admin?.role}</div>
            </div>
          </div>
        </main>
      </div>
    </AdminRoute>
  );
}
