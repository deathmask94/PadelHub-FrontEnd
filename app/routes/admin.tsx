import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AdminLayout from "~/components/ui/AdminLayout";
import { getStoredAdmin } from "~/services/adminAuth";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const admin    = getStoredAdmin();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = () => { navigate("/admin/login", { replace: true }); };
    window.addEventListener("padelhub:admin-session-expired", handler);
    return () => window.removeEventListener("padelhub:admin-session-expired", handler);
  }, [navigate]);

  return (
    <AdminLayout>
      <div style={{ padding: "36px 48px" }}>

        {/* Bienvenida */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
            Bienvenido, {admin?.name ?? "Admin"}
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>
            Sesión activa — válida por 4 horas ·{" "}
            {now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Accesos rápidos */}
        <h2 style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
          Acceso rápido
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 40 }}>
          {[
            { icon: "👥", title: "Usuarios",  desc: "Ver y gestionar jugadores",       path: "/admin/usuarios"  },
            { icon: "🏓", title: "Partidos",  desc: "Supervisar partidos activos",     path: "/admin/partidos"  },
            { icon: "💾", title: "Respaldo",  desc: "Backup e importación de BD",      path: "/admin/backup"    },
            { icon: "📊", title: "Métricas",  desc: "Estadísticas de la plataforma",  path: "/admin/metricas"  },
            { icon: "📋", title: "Auditoría", desc: "Registros de acceso admin",       path: "/admin/auditoria" },
          ].map(({ icon, title, desc, path }) => (
            <div
              key={title}
              onClick={() => navigate(path)}
              style={{
                background: "#1a1d2e", border: "1px solid #252840",
                borderRadius: 14, padding: "24px 20px",
                cursor: "pointer", transition: "border-color 0.2s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#84cc16";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#252840";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 5 }}>{title}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Info cuenta */}
        <div style={{
          background: "#1a1d2e", border: "1px solid #252840",
          borderRadius: 14, padding: "20px 24px",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
            Información de cuenta
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, fontSize: 13 }}>
            <div><span style={{ color: "#9ca3af", display: "block", fontSize: 11, marginBottom: 2 }}>Nombre</span>{admin?.name}</div>
            <div><span style={{ color: "#9ca3af", display: "block", fontSize: 11, marginBottom: 2 }}>Email</span>{admin?.email ?? "—"}</div>
            <div><span style={{ color: "#9ca3af", display: "block", fontSize: 11, marginBottom: 2 }}>RUT</span>{admin?.rut}-{admin?.dv_rut}</div>
            <div><span style={{ color: "#9ca3af", display: "block", fontSize: 11, marginBottom: 2 }}>Rol</span>{admin?.role}</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
