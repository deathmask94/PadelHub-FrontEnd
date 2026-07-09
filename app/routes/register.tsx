import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";


export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step,        setStep]        = useState<1 | 2>(1);
  const [error,       setError]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [showCreating, setShowCreating] = useState(false);

  const [form, setForm] = useState({
    nombre:          "",
    rutBody:         "",
    rutDv:           "",
    fechaNacimiento: "",
    telefono:        "",
    email:           "",
    genero:          "" as "" | "masculino" | "femenino",
    nivel:           "Principiante",
    ciudad:          "",
    password:        "",
    confirmPassword: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const setGenero = (v: "masculino" | "femenino") =>
    setForm((p) => ({ ...p, genero: v }));

  const MAX_BIRTH_DATE = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 10);
    return d.toISOString().split("T")[0];
  })();

  const handleNextStep = () => {
    setError("");
    if (!form.nombre.trim())                        return setError("Ingresa tu nombre completo.");
    if (!form.rutBody.trim() || !form.rutDv.trim()) return setError("Ingresa tu RUT completo.");
    if (!form.fechaNacimiento)                      return setError("Ingresa tu fecha de nacimiento.");
    if (form.fechaNacimiento > MAX_BIRTH_DATE)      return setError("Debes tener al menos 10 años.");
    if (!form.telefono.trim())                      return setError("Ingresa tu número de teléfono.");
    if (!form.email.trim())                         return setError("Ingresa tu correo electrónico.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("El correo electrónico no es válido.");
    if (!form.genero)                               return setError("Selecciona tu género.");
    setStep(2);
  };

  const handleSubmitFinal = async () => {
    setError("");
    if (!form.ciudad)                     return setError("Selecciona tu zona.");
    if (form.password.length < 8)         return setError("La contraseña debe tener al menos 8 caracteres.");
    if (form.password !== form.confirmPassword) return setError("Las contraseñas no coinciden.");

    setSubmitting(true);
    setShowCreating(true);
    const start = Date.now();
    try {
      await register({
        rut:        form.rutBody,
        dv_rut:     form.rutDv.toUpperCase(),
        phone:      form.telefono.replace(/\D/g, ""),
        name:       form.nombre,
        email:      form.email.toLowerCase().trim(),
        password:   form.password,
        zone:       form.ciudad,
        gender:     form.genero as "masculino" | "femenino",
        birth_date: form.fechaNacimiento || undefined,
      });
      // Asegurar que la pantalla se vea al menos 2 segundos
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 2000 - elapsed);
      setTimeout(() => navigate("/home", { replace: true }), remaining);
    } catch (e: unknown) {
      setShowCreating(false);
      setError(e instanceof Error ? e.message : "Error al registrarse");
    } finally {
      setSubmitting(false);
    }
  };

  if (showCreating) {
    return (
      <div className="ph-screen" style={{ alignItems: "center", justifyContent: "center" }}>
        <style>{`
          @keyframes ph-bar {
            from { width: 0%; }
            to   { width: 100%; }
          }
        `}</style>

        <div style={{ fontSize: 56, marginBottom: 20 }}>🎾</div>

        <div style={{
          fontFamily: "var(--font-display)", fontSize: 22,
          fontWeight: 800, marginBottom: 8, color: "var(--text)",
        }}>
          Creando usuario...
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 36 }}>
          Preparando tu cuenta en PadelHub
        </div>

        <div style={{
          width: 260, height: 6,
          background: "var(--bg3)",
          borderRadius: 4, overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            background: "#22c55e",
            borderRadius: 4,
            animation: "ph-bar 2s ease-in-out forwards",
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="ph-screen" style={{ justifyContent: "center" }}>
      <div style={{ padding: "0 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>

        {/* Logo */}
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src="/icon.png" alt="PadelHub"
            width={72} height={72}
            style={{ borderRadius: 22, margin: "0 auto 14px", display: "block" }}
          />
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "var(--text)" }}>PadelHub</div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
            {step === 1 ? "Únete a la comunidad" : "Configura tu cuenta"}
          </div>
        </div>

        <div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 1, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>
          PÁGINA {step} DE 2
        </div>

        {error && <div className="ph-error" style={{ fontSize: 12 }}>⚠️ {error}</div>}

        {/* PASO 1 */}
        {step === 1 && (
          <form className="fade-up-2" onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
            <div className="ph-input-group">
              <label className="ph-label" htmlFor="reg-nombre">Nombre completo</label>
              <input id="reg-nombre" name="name" className="ph-input" type="text" placeholder="Juan Pérez" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} autoComplete="name" />
            </div>

            <div className="ph-input-group">
              <label className="ph-label" htmlFor="reg-rut">RUT</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input id="reg-rut" name="rut" className="ph-input" type="text" placeholder="12345678" style={{ flex: 1 }}
                  value={form.rutBody} onChange={(e) => set("rutBody", e.target.value.replace(/\D/g, ""))} />
                <span style={{ color: "var(--text)" }}>-</span>
                <label className="sr-only" htmlFor="reg-rut-dv">Dígito verificador</label>
                <input id="reg-rut-dv" name="dv_rut" className="ph-input" type="text" placeholder="K" style={{ width: 45, textAlign: "center" }}
                  maxLength={1} value={form.rutDv} onChange={(e) => set("rutDv", e.target.value)} />
              </div>
            </div>

            <div className="ph-input-group">
              <label className="ph-label" htmlFor="reg-birth">Fecha de nacimiento</label>
              <input
                id="reg-birth" name="birth_date"
                className="ph-input"
                type="date"
                max={MAX_BIRTH_DATE}
                value={form.fechaNacimiento}
                onChange={(e) => set("fechaNacimiento", e.target.value)}
              />
            </div>

            <div className="ph-input-group">
              <label className="ph-label" htmlFor="reg-phone">Número de teléfono</label>
              <input id="reg-phone" name="phone" className="ph-input" type="tel" placeholder="+56912345678" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} autoComplete="tel" />
            </div>

            <div className="ph-input-group">
              <label className="ph-label" htmlFor="reg-email">Correo electrónico</label>
              <input id="reg-email" name="email" className="ph-input" type="email" placeholder="tucorreo@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
            </div>

            <div className="ph-input-group">
              <label className="ph-label">Género</label>
              <div style={{ display: "flex", gap: 10 }}>
                {(["masculino", "femenino"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenero(g)}
                    className={`ph-format-opt${form.genero === g ? " selected" : ""}`}
                    style={{ flex: 1, padding: "10px 0" }}
                  >
                    {g === "masculino" ? "Hombre" : "Mujer"}
                  </button>
                ))}
              </div>
            </div>

            <button className="ph-btn" type="submit" style={{ marginTop: 12 }}>
              Siguiente paso →
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{ width: "100%", padding: "10px", marginTop: 8, background: "transparent", border: "none", color: "var(--text2)", fontSize: 13, cursor: "pointer" }}
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </form>
        )}

        {/* PASO 2 */}
        {step === 2 && (
          <form className="fade-up-2" onSubmit={(e) => { e.preventDefault(); handleSubmitFinal(); }}>
            <div className="ph-input-group">
              <label className="ph-label" htmlFor="reg-nivel">Nivel estimado</label>
              <select id="reg-nivel" name="level" className="ph-input" style={{ background: "var(--bg3)", color: "var(--text)", width: "100%" }}
                value={form.nivel} onChange={(e) => set("nivel", e.target.value)}>
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </div>

            <div className="ph-input-group">
              <label className="ph-label" htmlFor="reg-zona">Zona</label>
              <select id="reg-zona" name="zone" className="ph-select" value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)}>
                <option value="">Selecciona tu zona</option>
                <option value="Viña del Mar">Viña del Mar</option>
                <option value="Valparaíso">Valparaíso</option>
                <option value="Quilpué">Quilpué</option>
                <option value="Villa Alemana">Villa Alemana</option>
                <option value="Concón">Concón</option>
              </select>
            </div>

            <div className="ph-input-group">
              <label className="ph-label" htmlFor="reg-password">Contraseña</label>
              <input id="reg-password" name="password" className="ph-input" type="password" placeholder="Mínimo 8 caracteres"
                value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" />
            </div>

            <div className="ph-input-group">
              <label className="ph-label" htmlFor="reg-confirm-password">Confirmar contraseña</label>
              <input id="reg-confirm-password" name="confirm_password" className="ph-input" type="password" placeholder="Repite tu contraseña"
                value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} autoComplete="new-password" />
            </div>

            <button className="ph-btn" type="submit" disabled={submitting} style={{ marginTop: 12 }}>
              {submitting ? "Registrando jugador…" : "Crear cuenta"}
            </button>

            <button className="ph-btn-ghost" type="button" onClick={() => setStep(1)} disabled={submitting}
              style={{ marginTop: 6, border: "none", background: "transparent", width: "100%" }}>
              ← Volver a datos personales
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
