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
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
            Sesión activa — válida por 4 horas ·{" "}
            {now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Info cuenta */}
        <div style={{
          background: "#ffffff", border: "1px solid #e2e8f0",
          borderRadius: 14, padding: "20px 24px",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
            Información de cuenta
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, fontSize: 13 }}>
            <div><span style={{ color: "#64748b", display: "block", fontSize: 11, marginBottom: 2 }}>Nombre</span>{admin?.name}</div>
            <div><span style={{ color: "#64748b", display: "block", fontSize: 11, marginBottom: 2 }}>Email</span>{admin?.email ?? "—"}</div>
            <div><span style={{ color: "#64748b", display: "block", fontSize: 11, marginBottom: 2 }}>RUT</span>{admin?.rut}-{admin?.dv_rut}</div>
            <div><span style={{ color: "#64748b", display: "block", fontSize: 11, marginBottom: 2 }}>Rol</span>{admin?.role}</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
