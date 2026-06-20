import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { loginAdmin, isAdminAuthenticated } from "~/services/adminAuth";

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "#1e2235", border: "1px solid #2d3250",
  borderRadius: 8, color: "#f1f5f9", fontSize: 14,
  fontFamily: "'DM Sans', sans-serif", outline: "none",
  boxSizing: "border-box",
};

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [rut,      setRut]      = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (isAdminAuthenticated()) navigate("/admin", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rut.trim() || !password) { setError("Completa todos los campos"); return; }
    setError(""); setLoading(true);
    try {
      await loginAdmin(rut.trim(), password);
      navigate("/admin", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, display: "flex",
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Panel izquierdo — branding */}
      <div style={{
        width: "42%", background: "#0c0e16",
        borderRight: "1px solid #1e2130",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "60px 48px",
      }}>
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🛡️</div>
          <h1 style={{
            fontSize: 32, fontWeight: 800, color: "#f1f5f9",
            margin: "0 0 12px", letterSpacing: "-0.5px",
          }}>
            PadelHub
          </h1>
          <p style={{
            fontSize: 14, color: "#84cc16", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 24px",
          }}>
            Panel de Administración
          </p>
          <p style={{
            fontSize: 13, color: "#4b5563", lineHeight: 1.7,
          }}>
            Gestión de usuarios, partidos, métricas y auditoría de la plataforma PadelHub.
          </p>

          <div style={{
            marginTop: 48, display: "flex", flexDirection: "column", gap: 10,
          }}>
            {["Gestión de usuarios", "Supervisión de partidos", "Logs de auditoría", "Backup de datos"].map((item) => (
              <div key={item} style={{
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 12, color: "#6b7280",
              }}>
                <span style={{ color: "#84cc16", fontSize: 10 }}>●</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{
        flex: 1, background: "#131620",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "60px 48px",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: "0 0 6px" }}>
            Iniciar sesión
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 32px" }}>
            Acceso restringido a administradores
          </p>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 8, padding: "10px 14px", fontSize: 13,
              color: "#f87171", marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 7 }}>
                RUT (sin puntos ni dígito verificador)
              </label>
              <input
                type="text"
                style={inp}
                placeholder="Ej: 11111111"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                autoComplete="username"
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#84cc16"; }}
                onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = "#2d3250"; }}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 7 }}>
                Contraseña
              </label>
              <input
                type="password"
                style={inp}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#84cc16"; }}
                onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = "#2d3250"; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "12px",
                background: loading ? "#4a7c14" : "#84cc16",
                border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 700, color: "#0c0e16",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {loading ? "Verificando…" : "Iniciar sesión"}
            </button>
          </form>

          <p style={{ marginTop: 32, fontSize: 11, color: "#374151", textAlign: "center" }}>
            PadelHub Admin · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
