// ============================================================
// app/routes/perfil.editar.tsx          ← RUTA: /perfil/editar
//
// Edición de perfil deportivo — HU-003.
// Foto (mockada), nivel, zona, categoría.
// ============================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";

const NIVELES    = ["Principiante","Iniciado","Intermedio","Avanzado","Experto"];
const CATEGORIAS = ["1ª","2ª","3ª","4ª","5ª","6ª","7ª"];
const ZONAS      = ["Valparaíso","Viña del Mar","Quilpué","Villa Alemana","Concón","Santiago Centro","Providencia","Las Condes"];

export default function EditarPerfilPage() {
  const { user, editarPerfil } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre:    user?.nombre    || "",
    edad:      user?.edad?.toString() || "",
    nivel:     user?.nivel     || "",
    categoria: user?.categoria || "",
    zona:      user?.zona      || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  // Actualiza un campo manteniendo el resto
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setError(""); setSuccess(false);
    if (!form.nombre.trim()) { setError("El nombre no puede estar vacío"); return; }
    setLoading(true);
    try {
      await editarPerfil({ ...form, edad: form.edad ? parseInt(form.edad) : null });
      setSuccess(true);
      setTimeout(() => navigate("/perfil"), 1800);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const initials = form.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="ph-screen">
      <div className="ph-top-bar">
        <Link to="/perfil" className="ph-back-btn">←</Link>
        <span className="ph-title">Editar perfil</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="ph-scroll">
        {/* ── Avatar / foto ────────────────────────────────────── */}
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div
            className="ph-avatar"
            style={{ width: 88, height: 88, fontSize: 28, border: "2px solid rgba(79,70,229,0.5)", cursor: "pointer", position: "relative" }}
            onClick={() => alert("En producción: selector de foto → Cloudinary")}
          >
            {initials}
            <span style={{ position: "absolute", bottom: -4, right: -4, background: "var(--accent)", borderRadius: 8, fontSize: 14, padding: "2px 4px" }}>📷</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 10 }}>Toca para cambiar tu foto</div>
        </div>

        {success && <div className="ph-success">✅ Perfil actualizado correctamente</div>}
        {error   && <div className="ph-error">⚠️ {error}</div>}

        {/* ── Información personal ─────────────────────────────── */}
        <div className="ph-section-label fade-up-1">Información personal</div>

        {[
          { key: "nombre", label: "Nombre completo", type: "text",   placeholder: "Tu nombre completo" },
          { key: "edad",   label: "Edad",            type: "number", placeholder: "Tu edad" },
        ].map(({ key, label, type, placeholder }) => (
          <div key={key} className="ph-input-group fade-up-1">
            <label className="ph-label">{label}</label>
            <input
              className="ph-input"
              type={type}
              placeholder={placeholder}
              value={form[key as keyof typeof form]}
              onChange={(e) => set(key, e.target.value)}
              min={type === "number" ? 10 : undefined}
              max={type === "number" ? 99 : undefined}
            />
          </div>
        ))}

        <div className="ph-input-group fade-up-1">
          <label className="ph-label">Zona</label>
          <select className="ph-select" value={form.zona} onChange={(e) => set("zona", e.target.value)}>
            <option value="">Selecciona tu zona</option>
            {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>

        {/* ── Nivel deportivo ──────────────────────────────────── */}
        <div className="ph-section-label fade-up-2" style={{ marginTop: 8 }}>Nivel deportivo</div>

        <div style={{
          background: "rgba(79,70,229,0.08)", border: "1px solid var(--border2)",
          borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#a5b4fc", marginBottom: 14,
        }}>
          💡 Tu nivel define el MMR inicial. El sistema te encontrará rivales de tu mismo nivel real.
        </div>

        {/* Botones de nivel — resalta el seleccionado */}
        <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
          {NIVELES.map((n) => (
            <button
              key={n}
              onClick={() => set("nivel", n)}
              style={{
                padding: 10, borderRadius: 12, cursor: "pointer",
                border: `1px solid ${form.nivel === n ? "var(--accent)" : "var(--border)"}`,
                background: form.nivel === n ? "rgba(79,70,229,0.12)" : "var(--bg3)",
                color: form.nivel === n ? "#a5b4fc" : "var(--text2)",
                fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
                transition: "all .2s",
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="ph-input-group fade-up-2">
          <label className="ph-label">Categoría</label>
          <select className="ph-select" value={form.categoria} onChange={(e) => set("categoria", e.target.value)}>
            <option value="">Selecciona tu categoría</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button className="ph-btn fade-up-3" onClick={handleSave} disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
