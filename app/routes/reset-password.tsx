import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("Enlace inválido. Solicita uno nuevo.");
  }, [token]);

  const handleSubmit = async () => {
    setError("");
    if (form.password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (form.password !== form.confirm) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al restablecer la contraseña");
      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ph-screen" style={{ justifyContent: "center" }}>
      <div style={{ padding: "0 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>

        <div className="fade-up" style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            Nueva contraseña
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>
            Elige una contraseña segura de al menos 8 caracteres.
          </div>
        </div>

        {success ? (
          <div className="fade-up" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              ¡Contraseña actualizada!
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>
              Redirigiendo al inicio de sesión...
            </div>
          </div>
        ) : (
          <div className="fade-up-1">
            {error && <div className="ph-error">⚠️ {error}</div>}

            <div className="ph-input-group">
              <label className="ph-label">Nueva contraseña</label>
              <input
                className="ph-input"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                autoComplete="new-password"
              />
            </div>

            <div className="ph-input-group">
              <label className="ph-label">Confirmar contraseña</label>
              <input
                className="ph-input"
                type="password"
                placeholder="Repite tu contraseña"
                value={form.confirm}
                onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                autoComplete="new-password"
              />
            </div>

            <button
              className="ph-btn"
              onClick={handleSubmit}
              disabled={loading || !token}
              style={{ marginTop: 8 }}
            >
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
