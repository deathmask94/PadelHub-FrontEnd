import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { forgotPassword, resetPassword } from "~/services/auth.mock";

export default function LoginPage() {
  const { isLogged, loading, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const telefonoPreset = searchParams.get("tel") ?? "";

  const [tel,        setTel]        = useState(telefonoPreset || "+56987654321");
  const [pass,       setPass]       = useState("12345678");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [showForgot, setShowForgot] = useState(false);

  // Único punto de navegación post-login
  useEffect(() => {
    if (isLogged) navigate("/home", { replace: true });
  }, [isLogged, navigate]);

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await login(tel, pass);
    } catch {
      setError("Teléfono o contraseña inválidos. Intenta nuevamente o regístrate.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (showForgot) return <ForgotPasswordInline onBack={() => setShowForgot(false)} />;

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
            <label className="ph-label">Teléfono</label>
            <input
              className="ph-input" type="tel" placeholder="+56 9 1234 5678"
              value={tel} onChange={(e) => setTel(e.target.value)} autoComplete="tel"
            />
          </div>

          <div className="ph-input-group">
            <label className="ph-label">Contraseña</label>
            <input
              className="ph-input" type="password" placeholder="••••••••"
              value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password"
            />
          </div>

          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <span
              style={{ fontSize: 12, color: "var(--accent)", cursor: "pointer" }}
              onClick={() => setShowForgot(true)}
            >
              ¿Olvidaste tu contraseña?
            </span>
          </div>

          <button className="ph-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </div>

        {/* WhatsApp */}
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

// ── Recuperar contraseña ───────────────────────────────────────────────────────
function ForgotPasswordInline({ onBack }: { onBack: () => void }) {
  const [step,      setStep]      = useState<1 | 2 | 3 | "done">(1);
  const [tel,       setTel]       = useState("");
  const [otp,       setOtp]       = useState("");
  const [pass,      setPass]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [countdown, setCountdown] = useState(60);

  const sendOtp = async () => {
    setError("");
    if (!tel) { setError("Ingresa tu teléfono"); return; }
    setLoading(true);
    try {
      await forgotPassword(tel);
      setStep(2);
      let s = 60; setCountdown(60);
      const t = setInterval(() => { s--; setCountdown(s); if (s <= 0) clearInterval(t); }, 1000);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const verifyOtp = () => {
    setError("");
    if (otp !== "123456") { setError("Código incorrecto (usa 123456 en modo dev)"); return; }
    setStep(3);
  };

  const resetPass = async () => {
    setError("");
    if (pass.length < 8) { setError("Mínimo 8 caracteres"); return; }
    setLoading(true);
    try { await resetPassword(tel, pass); setStep("done"); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="ph-screen" style={{ justifyContent: "center" }}>
      <div style={{ padding: "0 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>

        <button className="ph-back-btn" onClick={onBack} style={{ marginBottom: 24, alignSelf: "flex-start" }}>←</button>

        {step === 1 && (<>
          <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>📲</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>
            ¿Olvidaste tu contraseña?
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "center", marginBottom: 24 }}>
            Te enviamos un código por WhatsApp.
          </div>
          {error && <div className="ph-error">⚠️ {error}</div>}
          <label className="ph-label">Teléfono</label>
          <input className="ph-input" style={{ marginBottom: 14 }} type="tel"
            placeholder="+56 9 1234 5678" value={tel} onChange={(e) => setTel(e.target.value)} />
          <button className="ph-btn" onClick={sendOtp} disabled={loading}>
            {loading ? "Enviando…" : "Enviar código"}
          </button>
        </>)}

        {step === 2 && (<>
          <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>🔑</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>
            Código enviado
          </div>
          <div style={{
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#fcd34d", marginBottom: 16,
          }}>
            🧪 Dev: usa <strong>123456</strong>
          </div>
          {error && <div className="ph-error">⚠️ {error}</div>}
          <input className="ph-input"
            style={{ marginBottom: 8, fontSize: 28, textAlign: "center", letterSpacing: 8, fontFamily: "var(--font-display)", fontWeight: 700 }}
            type="text" maxLength={6} placeholder="000000" value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
          <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "center", marginBottom: 16 }}>
            {countdown > 0
              ? `Reenviar en ${countdown}s`
              : <span style={{ color: "var(--accent)", cursor: "pointer" }} onClick={sendOtp}>Reenviar código</span>}
          </div>
          <button className="ph-btn" onClick={verifyOtp}>Verificar código</button>
        </>)}

        {step === 3 && (<>
          <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>🔒</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, textAlign: "center", marginBottom: 24 }}>
            Nueva contraseña
          </div>
          {error && <div className="ph-error">⚠️ {error}</div>}
          <label className="ph-label">Nueva contraseña</label>
          <input className="ph-input" style={{ marginBottom: 14 }} type="password"
            placeholder="Mínimo 8 caracteres" value={pass} onChange={(e) => setPass(e.target.value)} />
          <button className="ph-btn" onClick={resetPass} disabled={loading}>
            {loading ? "Guardando…" : "Guardar contraseña"}
          </button>
        </>)}

        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>¡Listo!</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24 }}>
              Ya puedes iniciar sesión con tu nueva contraseña.
            </div>
            <button className="ph-btn" onClick={onBack}>Ir al login</button>
          </div>
        )}

      </div>
    </div>
  );
}
