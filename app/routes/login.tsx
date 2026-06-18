import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";

export default function LoginPage() {
  const { isLogged, loading, login } = useAuth();
  const navigate = useNavigate();

  const [rut,        setRut]        = useState("");
  const [pass,       setPass]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    if (isLogged) navigate("/home", { replace: true });
  }, [isLogged, navigate]);

  const handleSubmit = async () => {
    setError("");
    const rutLimpio = rut.replace(/\D/g, "");
    if (!rutLimpio || !pass) {
      setError("Ingresa tu RUT y contraseña");
      return;
    }
    setSubmitting(true);
    try {
      await login(rutLimpio, pass);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "RUT o contraseña inválidos");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="ph-screen" style={{ justifyContent: "center" }}>
      <div style={{
        padding: "0 28px", flex: 1,
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>

        {/* Logo */}
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, background: "var(--accent)", borderRadius: 22,
            margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "#fff" }}>H</span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "var(--text)" }}>
            PadelHub
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
            Encuentra tu próximo partido
          </div>
        </div>

        {/* Tabs */}
        <div className="fade-up-1" style={{
          display: "flex", background: "var(--bg3)", borderRadius: 14,
          padding: 4, marginBottom: 20, border: "1px solid var(--border)",
        }}>
          <button style={{
            flex: 1, padding: "9px", borderRadius: 10, border: "none",
            background: "var(--accent)", color: "#fff",
            fontSize: 13, fontWeight: 600, cursor: "default",
            fontFamily: "var(--font-body)",
          }}>
            Iniciar sesión
          </button>
          <button
            onClick={() => navigate("/register")}
            style={{
              flex: 1, padding: "9px", borderRadius: 10, border: "none",
              background: "transparent", color: "var(--text2)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "var(--font-body)", transition: "color .2s",
            }}
          >
            Registrarse
          </button>
        </div>

        {/* Formulario */}
        <div className="fade-up-2">
          {error && <div className="ph-error">⚠️ {error}</div>}

          <div className="ph-input-group">
            <label className="ph-label">RUT (sin puntos ni dígito verificador)</label>
            <input
              className="ph-input" type="text" placeholder="12345678"
              value={rut} onChange={(e) => setRut(e.target.value)} autoComplete="username"
            />
          </div>

          <div className="ph-input-group">
            <label className="ph-label">Contraseña</label>
            <input
              className="ph-input" type="password" placeholder="••••••••"
              value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password"
            />
          </div>

          <button className="ph-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            style={{
              width: "100%", marginTop: 12, background: "none", border: "none",
              color: "var(--text2)", fontSize: 13, cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

      </div>
    </div>
  );
}
