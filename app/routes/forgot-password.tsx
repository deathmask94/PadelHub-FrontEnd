import { useState } from "react";
import { useNavigate } from "react-router";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email,      setEmail]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [sent,       setSent]       = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email.trim()) return setError("Ingresa tu correo electrónico.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("El correo no es válido.");

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar el correo");
      setSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ph-screen" style={{ justifyContent: "center" }}>
      <div style={{ padding: "0 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>

        {!sent && (
          <button
            onClick={() => navigate("/login")}
            className="ph-back-btn"
            style={{ marginBottom: 24, alignSelf: "flex-start" }}
          >
            ←
          </button>
        )}

        {!sent && (
          <div className="fade-up" style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
              ¿Olvidaste tu contraseña?
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>
              Ingresa tu email y te enviaremos un enlace para restablecerla.
            </div>
          </div>
        )}

        {sent ? (
          <div className="fade-up" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Correo enviado
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 28, lineHeight: 1.6 }}>
              Si el email está registrado, recibirás un enlace en los próximos minutos.
              Revisa también tu carpeta de spam.
            </div>
            <button className="ph-btn" onClick={() => navigate("/login")}>
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <div className="fade-up-1">
            {error && <div className="ph-error">⚠️ {error}</div>}

            <div className="ph-input-group">
              <label className="ph-label">Correo electrónico</label>
              <input
                className="ph-input"
                type="email"
                placeholder="tucorreo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoComplete="email"
              />
            </div>

            <button className="ph-btn" onClick={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
