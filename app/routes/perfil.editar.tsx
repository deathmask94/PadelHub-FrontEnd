import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import ProtectedRoute from "~/components/ui/ProtectedRoute";
import { uploadProfilePhoto, deleteProfilePhoto } from "~/services/auth";

const ZONAS = [
  "Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana",
  "Concón", "Santiago Centro", "Providencia", "Las Condes",
];

export default function EditarPerfilPage() {
  const { user, editarPerfil } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: user?.nombre || "",
    zona:   user?.zona   || "",
  });
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState(false);
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photo_url ?? null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleDeletePhoto = async () => {
    if (!user) return;
    setUploadingPhoto(true);
    try {
      await deleteProfilePhoto(user.rut);
      setPhotoPreview(null);
      setPhotoFile(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al eliminar la foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setError(""); setSuccess(false);
    if (!form.nombre.trim()) { setError("El nombre no puede estar vacío"); return; }
    setLoading(true);
    try {
      if (photoFile && user) {
        setUploadingPhoto(true);
        await uploadProfilePhoto(user.rut, photoFile);
        setUploadingPhoto(false);
        setPhotoFile(null);
      }
      await editarPerfil({
        nombre:           form.nombre,
        zona:             form.zona,
        reminder_enabled: reminderEnabled,
      });
      setSuccess(true);
      setTimeout(() => navigate("/perfil", { replace: true }), 1800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  const initials = form.nombre.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <ProtectedRoute>
      <div className="ph-screen">
        <div className="ph-top-bar">
          <button className="ph-back-btn" onClick={() => navigate("/perfil", { replace: true })}>←</button>
          <span className="ph-title">Editar perfil</span>
          <div style={{ width: 36 }} />
        </div>

        <div className="ph-scroll">
          {/* Avatar */}
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            />
            <label
              htmlFor="photo-input"
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: "pointer" }}
            >
              <div
                className="ph-avatar"
                style={{ width: 88, height: 88, fontSize: 28, border: "2px solid var(--border2)", position: "relative", overflow: "hidden" }}
              >
                {photoPreview
                  ? <img src={photoPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                  : initials
                }
                <span style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "rgba(0,0,0,0.5)", textAlign: "center",
                  fontSize: 11, padding: "3px 0", color: "#fff",
                }}>
                  {uploadingPhoto ? "…" : "📷"}
                </span>
              </div>
            </label>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 10 }}>
              {photoFile ? "Foto lista — se subirá al guardar" : "Toca para cambiar la foto"}
            </div>
            {photoPreview && !photoFile && (
              <button
                type="button"
                onClick={handleDeletePhoto}
                disabled={uploadingPhoto}
                style={{ marginTop: 6, fontSize: 11, color: "#fca5a5", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Eliminar foto
              </button>
            )}
          </div>

          {success && <div className="ph-success">✅ Perfil actualizado correctamente</div>}
          {error   && <div className="ph-error">⚠️ {error}</div>}

          {/* Información personal */}
          <div className="ph-section-label fade-up-1">Información personal</div>

          <div className="ph-input-group fade-up-1">
            <label className="ph-label">Nombre completo</label>
            <input className="ph-input" type="text" placeholder="Tu nombre completo"
              value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
          </div>

          {user?.birth_date && (
            <div className="ph-input-group fade-up-1">
              <label className="ph-label">Fecha de nacimiento</label>
              <div className="ph-input" style={{ color: "var(--text2)", background: "var(--bg3)", cursor: "not-allowed", display: "flex", alignItems: "center", gap: 8 }}>
                <span>📅</span>
                {new Date(user.birth_date).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}
                <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text2)" }}>No editable</span>
              </div>
            </div>
          )}

          <div className="ph-input-group fade-up-1">
            <label className="ph-label">Zona</label>
            <select className="ph-select" value={form.zona} onChange={(e) => set("zona", e.target.value)}>
              <option value="">Selecciona tu zona</option>
              {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>


          {/* Toggle recordatorios */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--bg3)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "14px 16px", marginBottom: 16,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Recordatorios de partido</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                Email 24 h y 1 h antes del partido
              </div>
            </div>
            <button
              onClick={() => setReminderEnabled((v) => !v)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                background: reminderEnabled ? "var(--accent)" : "var(--border)",
                position: "relative", transition: "background 0.2s", flexShrink: 0,
              }}
            >
              <span style={{
                position: "absolute", top: 3,
                left: reminderEnabled ? 22 : 3,
                width: 18, height: 18, borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
              }} />
            </button>
          </div>

          <button className="ph-btn fade-up-3" onClick={handleSave} disabled={loading || uploadingPhoto} style={{ marginTop: 8 }}>
            {uploadingPhoto ? "Subiendo foto..." : loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
