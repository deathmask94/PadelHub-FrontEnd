import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import AdminRoute from "~/components/ui/AdminRoute";
import { adminFetch } from "~/services/adminAuth";

interface AdminUserDetail {
  id: string; rut: number; dv_rut: string; name: string; email: string | null;
  phone: string; level: string; zone: string; mmr: number;
  role: string; is_active: boolean; reminder_enabled: boolean;
  photo_url: string | null; created_at: string; updated_at: string;
  _count: { matches: number; match_players: number; mmr_history: number };
}

const NIVELES = [
  { key: "primera",    label: "1ra Categoría" },
  { key: "segunda",    label: "2da Categoría" },
  { key: "tercera",    label: "3ra Categoría" },
  { key: "cuarta",     label: "4ta Categoría" },
  { key: "quinta",     label: "5ta Categoría" },
  { key: "sexta",      label: "6ta Categoría" },
  { key: "septima_mas",label: "7ma+ Categoría" },
];
const ZONAS = ["Valparaíso","Viña del Mar","Quilpué","Villa Alemana","Concón"];

const sel: React.CSSProperties = {
  background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8,
  color: "var(--text)", fontSize: 13, padding: "8px 12px",
  fontFamily: "var(--font-body)", width: "100%",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | boolean | null }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <div style={{ fontSize: 14, color: "var(--text)" }}>{String(value ?? "—")}</div>
    </div>
  );
}

export default function AdminUsuarioDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user,    setUser]    = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState("");

  // Campos editables
  const [level, setLevel] = useState("");
  const [zone,  setZone]  = useState("");

  // Ajuste MMR
  const [newMmr,    setNewMmr]    = useState("");
  const [mmrReason, setMmrReason] = useState("");
  const [mmrSaving, setMmrSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminFetch<{ user: AdminUserDetail }>(`/api/admin/users/${id}`)
      .then(({ user: u }) => {
        setUser(u);
        setLevel(u.level);
        setZone(u.zone);
        setNewMmr(String(u.mmr));
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error al cargar usuario"))
      .finally(() => setLoading(false));
  }, [id]);

  const patch = async (updates: Record<string, unknown>, msg: string) => {
    if (!user) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const { user: updated } = await adminFetch<{ user: AdminUserDetail }>(
        `/api/admin/users/${user.id}`,
        { method: "PATCH", body: JSON.stringify(updates) },
      );
      setUser((prev) => prev ? { ...prev, ...updated } : prev);
      setSuccess(msg);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleMmrAdjust = async () => {
    if (!user) return;
    const val = parseInt(newMmr, 10);
    if (isNaN(val) || val < 0 || val > 9999) { setError("MMR debe ser entre 0 y 9999"); return; }
    if (!mmrReason.trim()) { setError("El motivo es requerido"); return; }
    if (!confirm(`¿Ajustar MMR de ${user.name} de ${user.mmr} → ${val}?`)) return;
    setMmrSaving(true); setError(""); setSuccess("");
    try {
      const res = await adminFetch<{ message: string; new_mmr: number }>(
        `/api/admin/users/${user.id}/mmr`,
        { method: "PATCH", body: JSON.stringify({ new_mmr: val, reason: mmrReason.trim() }) },
      );
      setUser((prev) => prev ? { ...prev, mmr: res.new_mmr } : prev);
      setMmrReason("");
      setSuccess(`MMR actualizado a ${res.new_mmr}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al ajustar MMR");
    } finally {
      setMmrSaving(false);
    }
  };

  const handleToggleActive = () => {
    if (!user) return;
    const action = user.is_active ? "suspender" : "reactivar";
    if (!confirm(`¿Seguro que deseas ${action} la cuenta de ${user.name}?`)) return;
    patch({ is_active: !user.is_active }, user.is_active ? "Cuenta suspendida" : "Cuenta reactivada");
  };

  const handleSaveEdits = () => {
    if (!user) return;
    const updates: Record<string, string> = {};
    if (level !== user.level) updates.level = level;
    if (zone  !== user.zone)  updates.zone  = zone;
    if (Object.keys(updates).length === 0) { setSuccess("Sin cambios"); return; }
    patch(updates, "Cambios guardados correctamente");
  };

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });

  if (loading) {
    return (
      <AdminRoute>
        <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)", fontSize: 14 }}>
          Cargando...
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
        {/* Navbar */}
        <header style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 24px",
          background: "var(--bg2)", borderBottom: "1px solid var(--border)",
        }}>
          <button onClick={() => navigate("/admin/usuarios")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text2)", padding: 0 }}>
            ←
          </button>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Perfil de usuario</span>
        </header>

        <main style={{ padding: "24px", maxWidth: 700, margin: "0 auto" }}>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444", marginBottom: 16 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: "rgba(132,204,22,0.1)", border: "1px solid var(--accent)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--accent)", marginBottom: 16 }}>
              ✓ {success}
            </div>
          )}

          {user && (
            <>
              {/* Cabecera de perfil */}
              <div style={{
                background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14,
                padding: "20px 20px", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%", flexShrink: 0,
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 700, overflow: "hidden",
                }}>
                  {user.photo_url
                    ? <img src={user.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials(user.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {user.name}
                    {!user.is_active && (
                      <span style={{ fontSize: 11, background: "rgba(239,68,68,0.15)", color: "#ef4444", borderRadius: 6, padding: "2px 8px" }}>
                        SUSPENDIDO
                      </span>
                    )}
                    {user.role === "admin" && (
                      <span style={{ fontSize: 11, background: "rgba(132,204,22,0.15)", color: "var(--accent)", borderRadius: 6, padding: "2px 8px" }}>
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>
                    {user.rut}-{user.dv_rut} · {user.email ?? user.phone}
                  </div>
                </div>
                <div style={{
                  textAlign: "center", flexShrink: 0,
                  background: "rgba(132,204,22,0.08)", border: "1px solid var(--border2)",
                  borderRadius: 10, padding: "10px 16px",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>{user.mmr}</div>
                  <div style={{ fontSize: 10, color: "var(--text2)" }}>MMR</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Partidos org.", value: user._count.matches },
                  { label: "Partidos jugados", value: user._count.match_players },
                  { label: "Cambios MMR", value: user._count.mmr_history },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: "var(--bg2)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "12px 14px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Información */}
              <div style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "20px", marginBottom: 20,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  INFORMACIÓN
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                  <Field label="Teléfono"      value={user.phone} />
                  <Field label="Zona"           value={user.zone} />
                  <Field label="Nivel actual"   value={user.level} />
                  <Field label="Recordatorios"  value={user.reminder_enabled ? "Activados" : "Desactivados"} />
                  <Field label="Registro"       value={fmtDate(user.created_at)} />
                  <Field label="Últ. actualiz." value={fmtDate(user.updated_at)} />
                </div>
              </div>

              {/* Edición nivel y zona */}
              <div style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "20px", marginBottom: 20,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  EDITAR NIVEL Y ZONA
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <div>
                    <Label>Nivel</Label>
                    <select style={sel} value={level} onChange={(e) => setLevel(e.target.value)}>
                      {NIVELES.map(({ key, label }) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Zona</Label>
                    <select style={sel} value={zone} onChange={(e) => setZone(e.target.value)}>
                      {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleSaveEdits}
                  disabled={saving}
                  style={{
                    background: "var(--accent)", border: "none", borderRadius: 10,
                    padding: "10px 20px", fontSize: 13, fontWeight: 600,
                    color: "#000", cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>

              {/* Ajuste MMR */}
              <div style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "20px", marginBottom: 20,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  AJUSTE MANUAL DE MMR
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <Label>Nuevo MMR</Label>
                    <input
                      type="number" min={0} max={9999}
                      value={newMmr}
                      onChange={(e) => setNewMmr(e.target.value)}
                      style={{ ...sel, appearance: "none" }}
                    />
                  </div>
                  <div>
                    <Label>Motivo del ajuste</Label>
                    <input
                      type="text"
                      placeholder="Ej: corrección por error de cálculo..."
                      value={mmrReason}
                      onChange={(e) => setMmrReason(e.target.value)}
                      style={sel}
                    />
                  </div>
                </div>
                <button
                  onClick={handleMmrAdjust}
                  disabled={mmrSaving}
                  style={{
                    background: "rgba(250,204,21,0.15)",
                    border: "1px solid #facc15",
                    borderRadius: 10, padding: "10px 20px",
                    fontSize: 13, fontWeight: 600, color: "#facc15",
                    cursor: mmrSaving ? "not-allowed" : "pointer",
                    opacity: mmrSaving ? 0.6 : 1,
                  }}
                >
                  {mmrSaving ? "Ajustando..." : "Aplicar ajuste MMR"}
                </button>
              </div>

              {/* Suspender / Reactivar */}
              {user.role !== "admin" && (
                <div style={{
                  background: "var(--bg2)", border: `1px solid ${user.is_active ? "#ef4444" : "var(--border)"}`,
                  borderRadius: 14, padding: "20px", marginBottom: 16,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    ESTADO DE CUENTA
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
                    {user.is_active
                      ? "La cuenta está activa. Suspender impedirá que el usuario acceda a la plataforma."
                      : "La cuenta está suspendida. El usuario no puede iniciar sesión hasta que sea reactivado."}
                  </p>
                  <button
                    onClick={handleToggleActive}
                    disabled={saving}
                    style={{
                      background: user.is_active ? "rgba(239,68,68,0.1)" : "rgba(132,204,22,0.1)",
                      border: `1px solid ${user.is_active ? "#ef4444" : "var(--accent)"}`,
                      borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600,
                      color: user.is_active ? "#ef4444" : "var(--accent)",
                      cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? "Procesando..." : user.is_active ? "Suspender cuenta" : "Reactivar cuenta"}
                  </button>
                </div>
              )}

            </>
          )}
        </main>
      </div>
    </AdminRoute>
  );
}
