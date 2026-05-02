// ============================================================
// app/routes/login.tsx                          ← RUTA: /login
//
// Pantalla de Inicio de Sesión y Registro.
// Historias:  HU-001 (Registro)  +  HU-002 (Inicio de sesión)
//
// CONCEPTOS REACT ROUTER v7 USADOS AQUÍ:
// • useNavigate()  → navegar entre rutas por código
// • Link           → enlace declarativo sin recargar la página
// • Esta función exportada "default" ES la página en sí misma
// ============================================================

import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "~/context/AuthContext";

// ── Sub-componente: formulario de Login ───────────────────────────────────────
function LoginForm({ onForgot }: { onForgot: () => void }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [tel, setTel]   = useState("+56987654321");
  const [pass, setPass] = useState("12345678");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await login(tel, pass);
      navigate("/home"); // Redirige a Home si todo va bien
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && <div className="ph-error">⚠️ {error}</div>}

      <div className="ph-input-group">
        <label className="ph-label">Teléfono</label>
        {/*
          INPUT CONTROLADO: "value" = variable de estado, "onChange" = actualiza el estado.
          Cada vez que el usuario escribe, React vuelve a renderizar con el nuevo valor.
        */}
        <input
          className="ph-input"
          type="tel"
          placeholder="+56 9 1234 5678"
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          autoComplete="tel"
        />
      </div>

      <div className="ph-input-group">
        <label className="ph-label">Contraseña</label>
        <input
          className="ph-input"
          type="password"
          placeholder="••••••••"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      <div style={{ textAlign: "right", marginBottom: "16px" }}>
        <span
          style={{ fontSize: "12px", color: "var(--accent)", cursor: "pointer" }}
          onClick={onForgot}
        >
          ¿Olvidaste tu contraseña?
        </span>
      </div>

      <button className="ph-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </>
  );
}

// ── Sub-componente: formulario de Registro ────────────────────────────────────
function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nombre: "", telefono: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Función helper: actualiza solo el campo que cambió
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.nombre || !form.telefono || !form.password) {
      setError("Completa todos los campos");
      return;
    }
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate("/perfil/editar"); // Tras registrarse → completar perfil (HU-003)
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && <div className="ph-error">⚠️ {error}</div>}

      {["nombre", "telefono", "password"].map((campo) => (
        <div key={campo} className="ph-input-group">
          <label className="ph-label">
            {campo === "nombre" ? "Nombre completo" : campo === "telefono" ? "Teléfono" : "Contraseña"}
          </label>
          <input
            className="ph-input"
            type={campo === "password" ? "password" : campo === "telefono" ? "tel" : "text"}
            placeholder={campo === "nombre" ? "Tu nombre completo" : campo === "telefono" ? "+56 9 1234 5678" : "Mínimo 8 caracteres"}
            value={form[campo as keyof typeof form]}
            onChange={(e) => set(campo, e.target.value)}
          />
        </div>
      ))}

      <button className="ph-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </>
  );
}

// ── Componente página principal ───────────────────────────────────────────────
export default function LoginPage() {
  // "tab" controla si mostramos el form de login o el de registro
  const [tab, setTab]       = useState<"login" | "register">("login");
  const [showForgot, setShowForgot] = useState(false);

  // Si el usuario hizo clic en "¿Olvidaste tu contraseña?", mostramos el mini-formulario
  if (showForgot) {
    return <ForgotPasswordInline onBack={() => setShowForgot(false)} />;
  }

  return (
    <div className="ph-screen" style={{ justifyContent: "center" }}>
      <div style={{ padding: "0 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>

        {/* Logo */}
        <div className="fade-up" style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            width: 72, height: 72, background: "var(--accent)", borderRadius: 22,
            margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "#fff" }}>H</span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800 }}>PadelHub</div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>Encuentra tu próximo partido</div>
        </div>

        {/* Pestañas */}
        <div className="fade-up-1" style={{
          display: "flex", background: "var(--bg3)", borderRadius: 14,
          padding: 4, marginBottom: 20, border: "1px solid var(--border)",
        }}>
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "9px", borderRadius: 10, border: "none",
                background: tab === t ? "var(--accent)" : "transparent",
                color: tab === t ? "#fff" : "var(--text2)",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-body)", transition: "all .2s",
              }}
            >
              {t === "login" ? "Iniciar sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        {/* Formulario activo */}
        <div className="fade-up-2">
          {tab === "login"
            ? <LoginForm onForgot={() => setShowForgot(true)} />
            : <RegisterForm />
          }
        </div>

        {/* WhatsApp */}
        <div className="ph-divider fade-up-3">
          <div className="ph-divider-line" />
          <span className="ph-divider-text">o continúa con</span>
          <div className="ph-divider-line" />
        </div>
        <button className="ph-btn-ghost fade-up-3">
          <span style={{ width: 16, height: 16, background: "#25d366", borderRadius: "50%", display: "inline-block" }} />
          Continuar con WhatsApp
        </button>
      </div>
    </div>
  );
}

// ── Sub-pantalla: Recuperar contraseña (HU-005) ───────────────────────────────
// Se muestra inline dentro de login.tsx sin cambiar de ruta
function ForgotPasswordInline({ onBack }: { onBack: () => void }) {
  const [step, setStep]   = useState<1 | 2 | 3 | "done">(1);
  const [tel, setTel]     = useState("");
  const [otp, setOtp]     = useState("");
  const [pass, setPass]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [countdown, setCountdown] = useState(60);

  const sendOtp = async () => {
    setError("");
    if (!tel) { setError("Ingresa tu teléfono"); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep(2);
    // Countdown de 60s
    let s = 60;
    setCountdown(60);
    const t = setInterval(() => { s--; setCountdown(s); if (s <= 0) clearInterval(t); }, 1000);
  };

  const verifyOtp = () => {
    if (otp !== "123456") { setError("Código incorrecto (usa 123456 en modo dev)"); return; }
    setStep(3);
  };

  const resetPass = async () => {
    if (pass.length < 8) { setError("Mínimo 8 caracteres"); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setStep("done");
  };

  return (
    <div className="ph-screen" style={{ justifyContent: "center" }}>
      <div style={{ padding: "0 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <button className="ph-back-btn" onClick={onBack} style={{ marginBottom: 24, alignSelf: "flex-start" }}>←</button>

        {step === 1 && <>
          <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>📲</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>¿Olvidaste tu contraseña?</div>
          <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "center", marginBottom: 24 }}>Te enviamos un código por WhatsApp.</div>
          {error && <div className="ph-error">⚠️ {error}</div>}
          <label className="ph-label">Teléfono</label>
          <input className="ph-input" style={{ marginBottom: 14 }} type="tel" placeholder="+56 9 1234 5678" value={tel} onChange={(e) => setTel(e.target.value)} />
          <button className="ph-btn" onClick={sendOtp} disabled={loading}>{loading ? "Enviando..." : "Enviar código"}</button>
        </>}

        {step === 2 && <>
          <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>🔑</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>Código enviado</div>
          <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#fcd34d", marginBottom: 16 }}>
            🧪 Dev: usa <strong>123456</strong>
          </div>
          {error && <div className="ph-error">⚠️ {error}</div>}
          <input className="ph-input" style={{ marginBottom: 8, fontSize: 28, textAlign: "center", letterSpacing: 8, fontFamily: "var(--font-display)", fontWeight: 700 }}
            type="text" maxLength={6} placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
          <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "center", marginBottom: 16 }}>
            {countdown > 0 ? `Reenviar en ${countdown}s` : <span style={{ color: "var(--accent)", cursor: "pointer" }} onClick={sendOtp}>Reenviar código</span>}
          </div>
          <button className="ph-btn" onClick={verifyOtp}>Verificar código</button>
        </>}

        {step === 3 && <>
          <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>🔒</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 24 }}>Nueva contraseña</div>
          {error && <div className="ph-error">⚠️ {error}</div>}
          <label className="ph-label">Nueva contraseña</label>
          <input className="ph-input" style={{ marginBottom: 14 }} type="password" placeholder="Mínimo 8 caracteres" value={pass} onChange={(e) => setPass(e.target.value)} />
          <button className="ph-btn" onClick={resetPass} disabled={loading}>{loading ? "Guardando..." : "Guardar contraseña"}</button>
        </>}

        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>¡Listo!</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24 }}>Ya puedes iniciar sesión con tu nueva contraseña.</div>
            <button className="ph-btn" onClick={onBack}>Ir al login</button>
          </div>
        )}
      </div>
    </div>
  );
}
