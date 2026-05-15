import { useState } from "react";
import { useNavigate } from "react-router";
import { signUpUser } from "~/services/auth.mock";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ nombre: "", telefono: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError("");

    if (!form.nombre.trim()) {
      setError("Ingresa tu nombre completo.");
      return;
    }
    if (!form.telefono.trim()) {
      setError("Ingresa tu número de teléfono.");
      return;
    }
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      // Solo registra en el mock, NO inicia sesión
      await signUpUser({
        nombre:   form.nombre.trim(),
        telefono: form.telefono.trim(),
        password: form.password,
      });

      // Vuelve al login con el teléfono pre-llenado
      navigate(`/login?tel=${encodeURIComponent(form.telefono.trim())}`, {
        replace: true,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ph-screen" style={{ justifyContent: "center" }}>
      <div style={{
        padding: "0 28px", flex: 1,
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>

        {/* ── Logo ── */}
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

        {/* ── Tabs ── */}
        <div className="fade-up-1" style={{
          display: "flex", background: "var(--bg3)", borderRadius: 14,
          padding: 4, marginBottom: 20, border: "1px solid var(--border)",
        }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              flex: 1, padding: "9px", borderRadius: 10, border: "none",
              background: "transparent", color: "var(--text2)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "var(--font-body)", transition: "color .2s",
            }}
          >
            Iniciar sesión
          </button>
          <button style={{
            flex: 1, padding: "9px", borderRadius: 10, border: "none",
            background: "var(--accent)", color: "#fff",
            fontSize: 13, fontWeight: 600, cursor: "default",
            fontFamily: "var(--font-body)",
          }}>
            Registrarse
          </button>
        </div>

        {/* ── Formulario ── */}
        <div className="fade-up-2">
          {error && <div className="ph-error">⚠️ {error}</div>}

          <div className="ph-input-group">
            <label className="ph-label">Nombre completo</label>
            <input
              className="ph-input" type="text" placeholder="Tu nombre"
              value={form.nombre} onChange={(e) => set("nombre", e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="ph-input-group">
            <label className="ph-label">Teléfono</label>
            <input
              className="ph-input" type="tel" placeholder="+56 9 1234 5678"
              value={form.telefono} onChange={(e) => set("telefono", e.target.value)}
              autoComplete="tel"
            />
          </div>

          <div className="ph-input-group">
            <label className="ph-label">Contraseña</label>
            <input
              className="ph-input" type="password" placeholder="Mínimo 8 caracteres"
              value={form.password} onChange={(e) => set("password", e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            className="ph-btn"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ marginTop: 4 }}
          >
            {submitting ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </div>

        {/* ── WhatsApp ── */}
        <div className="ph-divider fade-up-3">
          <div className="ph-divider-line" />
          <span className="ph-divider-text">o continúa con</span>
          <div className="ph-divider-line" />
        </div>
        <button className="ph-btn-ghost fade-up-3">
          <span style={{
            width: 16, height: 16, background: "#25d366",
            borderRadius: "50%", display: "inline-block", flexShrink: 0,
          }} />
          Continuar con WhatsApp
        </button>

      </div>
    </div>
  );
}
