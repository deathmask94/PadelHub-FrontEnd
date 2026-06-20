import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { loginAdmin, isAdminAuthenticated } from "~/services/adminAuth";

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
      width: "100%", alignSelf: "stretch", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: 20, fontFamily: "var(--font-body)",
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: "var(--bg2)",
        border: "1px solid var(--border)", borderRadius: 16, padding: "44px 40px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 14,
            background: "rgba(132,204,22,0.12)", border: "1px solid var(--accent)",
            fontSize: 28, marginBottom: 14,
          }}>🛡️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text)" }}>
            Panel Administrador
          </h1>
          <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>PadelHub</p>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444",
            borderRadius: 10, padding: "10px 14px", fontSize: 13,
            color: "#ef4444", marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text2)" }}>
              RUT (sin puntos ni dígito verificador)
            </label>
            <input
              type="text"
              className="ph-input"
              placeholder="Ej: 11111111"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text2)" }}>
              Contraseña
            </label>
            <input
              type="password"
              className="ph-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="ph-btn"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Verificando…" : "Iniciar sesión"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text2)", marginTop: 20, marginBottom: 0 }}>
          Acceso restringido a administradores
        </p>
      </div>
    </div>
  );
}
