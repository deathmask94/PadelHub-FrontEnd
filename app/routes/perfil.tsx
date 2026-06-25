import { useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "~/context/AuthContext";
import { apiFetch, uploadProfilePhoto, deleteProfilePhoto } from "~/services/auth";
import NavBar from "~/components/ui/NavBar";

const ZONAS = ["Viña del Mar", "Valparaíso", "Quilpué", "Villa Alemana", "Concón"];

const NIVEL_LABEL: Record<string, string> = {
  primera:     "1ra Categoría",
  segunda:     "2da Categoría",
  tercera:     "3ra Categoría",
  cuarta:      "4ta Categoría",
  quinta:      "5ta Categoría",
  sexta:       "6ta Categoría",
  septima_mas: "7ma+ Categoría",
};

interface RankingStats {
  ranking_position:  number;
  total_in_zone:     number;
  mmr_variation_30d: number;
  matches_played:    number;
  wins:              number;
  mmr_chart:         number[];
  last_matches:      { club: string | null; date: string | null; delta: number; win: boolean }[];
}
interface PlayerRatings {
  avg_fair_play:   number | null;
  avg_punctuality: number | null;
  avg_skill_level: number | null;
  total:           number;
}

function StarDisplay({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: "var(--text2)", fontSize: 12 }}>—</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ color: "#facc15", fontSize: 14 }}>★</span>
      <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800 }}>{value.toFixed(1)}</span>
    </div>
  );
}

export default function Perfil() {
  const { user, logout, editarPerfil } = useAuth();
  const navigate    = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats,        setStats]        = useState<RankingStats | null>(null);
  const [playerRatings, setPlayerRatings] = useState<PlayerRatings | null>(null);

  // Edit state
  const [nombre,          setNombre]          = useState(user?.nombre ?? "");
  const [zona,            setZona]            = useState(user?.zona   ?? "");
  const [reminderEnabled, setReminderEnabled] = useState(user?.reminder_enabled ?? true);
  const [photoFile,       setPhotoFile]       = useState<File | null>(null);
  const [photoPreview,    setPhotoPreview]    = useState<string | null>(user?.photo_url ?? null);
  const [saving,          setSaving]          = useState(false);
  const [uploadingPhoto,  setUploadingPhoto]  = useState(false);
  const [saveError,       setSaveError]       = useState("");
  const [saveSuccess,     setSaveSuccess]     = useState(false);

  useEffect(() => {
    if (!user?.rut) return;
    apiFetch<{ stats: RankingStats }>(`/api/users/${user.rut}/profile`)
      .then((d) => setStats(d.stats))
      .catch(() => {});
    apiFetch<{ ratings: PlayerRatings }>(`/api/users/${user.rut}/ratings`)
      .then((d) => setPlayerRatings(d.ratings))
      .catch(() => {});
  }, [user?.rut]);

  // Keep form in sync with context (e.g. after save)
  useEffect(() => {
    if (!user) return;
    setNombre(user.nombre ?? "");
    setZona(user.zona   ?? "");
    setReminderEnabled(user.reminder_enabled ?? true);
    setPhotoPreview(user.photo_url ?? null);
  }, [user?.rut]);

  const isDirty =
    nombre          !== (user?.nombre           ?? "") ||
    zona            !== (user?.zona             ?? "") ||
    reminderEnabled !== (user?.reminder_enabled ?? true) ||
    photoFile !== null;

  const initiales = nombre
    ? nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const matchesPlayed = stats?.matches_played ?? 0;
  const victorias     = stats?.wins           ?? 0;
  const esNuevo       = matchesPlayed === 0;
  const lastMatches   = stats?.last_matches   ?? [];
  const mmrChart      = stats?.mmr_chart      ?? [];
  const maxMMR        = mmrChart.length > 0 ? Math.max(...mmrChart) : 1;
  const semanas       = mmrChart.map((_, i) => `S${i + 1}`);

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
    } catch {
      // ignore
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaveError(""); setSaveSuccess(false);
    if (!nombre.trim()) { setSaveError("El nombre no puede estar vacío"); return; }
    setSaving(true);
    try {
      if (photoFile && user) {
        setUploadingPhoto(true);
        await uploadProfilePhoto(user.rut, photoFile);
        setUploadingPhoto(false);
        setPhotoFile(null);
      }
      await editarPerfil({ nombre, zona, reminder_enabled: reminderEnabled });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="ph-screen">
      <div className="ph-scroll" style={{ padding: "0 0 16px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px" }}>
          <button className="ph-back-btn" onClick={() => navigate("/home", { replace: true })}>←</button>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>Mi perfil</div>
          <button
            onClick={handleLogout}
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "6px 12px", color: "#fca5a5", fontSize: 12, fontFamily: "var(--font-body)", fontWeight: 600, cursor: "pointer" }}
          >
            Salir
          </button>
        </div>

        <div style={{ padding: "0 20px" }}>

          {/* ── Cabecera usuario (editable) ── */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>

            {/* Avatar + cámara */}
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
              <div style={{ position: "relative" }}>
                <div
                  className="ph-avatar"
                  style={{ width: 64, height: 64, fontSize: 22, background: "var(--accent)", borderRadius: 20, flexShrink: 0, overflow: "hidden" }}
                >
                  {photoPreview
                    ? <img src={photoPreview} alt={nombre} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                    : initiales
                  }
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", border: "2px solid var(--bg)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  📷
                </button>
              </div>
              {photoPreview && !photoFile && (
                <button
                  onClick={handleDeletePhoto}
                  disabled={uploadingPhoto}
                  style={{ fontSize: 10, color: "#fca5a5", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0, marginTop: 2 }}
                >
                  Eliminar
                </button>
              )}
            </div>

            {/* Nombre + Zona + categoría */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                className="ph-input"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, textTransform: "uppercase", marginBottom: 8, padding: "6px 10px" }}
              />
              <select
                className="ph-select"
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                style={{ marginBottom: 8, fontSize: 13 }}
              >
                <option value="">Selecciona tu zona</option>
                {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
              <div>
                {user?.nivel
                  ? <span className="ph-pill ph-pill-green">{NIVEL_LABEL[user.nivel] ?? user.nivel}</span>
                  : <span className="ph-pill ph-pill-gray">Sin categoría aún</span>
                }
              </div>
            </div>
          </div>

          {/* ── Notificaciones ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Recordatorios de partido</div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>Email 24 h y 1 h antes del partido</div>
            </div>
            <button
              onClick={() => setReminderEnabled((v) => !v)}
              style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: reminderEnabled ? "var(--accent)" : "var(--border)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
            >
              <span style={{ position: "absolute", top: 3, left: reminderEnabled ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </button>
          </div>

          {/* ── Guardar ── */}
          {saveError   && <div className="ph-error"   style={{ marginBottom: 8 }}>⚠️ {saveError}</div>}
          {saveSuccess && <div className="ph-success" style={{ marginBottom: 8 }}>✅ Perfil actualizado</div>}
          {isDirty && (
            <button className="ph-btn" onClick={handleSave} disabled={saving || uploadingPhoto} style={{ marginBottom: 16 }}>
              {uploadingPhoto ? "Subiendo foto..." : saving ? "Guardando..." : "Guardar cambios"}
            </button>
          )}

          {/* ── MMR card ── */}
          <div className="ph-mmr-bar" style={{ marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
                MMR
              </div>
              <div className="ph-mmr-num">{user?.mmr ?? 1000}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                {esNuevo
                  ? "Juega partidos para obtener ranking"
                  : stats
                    ? `#${stats.ranking_position} en ${user?.zona ?? "tu zona"} (de ${stats.total_in_zone})`
                    : `— en ${user?.zona ?? "tu zona"}`}
              </div>
            </div>
            {!esNuevo && stats && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: stats.mmr_variation_30d >= 0 ? "#4ade80" : "#fca5a5" }}>
                  {stats.mmr_variation_30d >= 0 ? "▲" : "▼"} {stats.mmr_variation_30d >= 0 ? "+" : ""}{stats.mmr_variation_30d}
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>último mes</div>
              </div>
            )}
          </div>

          {/* ── Stats ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { val: String(matchesPlayed),                                                                       label: "Partidos"  },
              { val: esNuevo ? "—" : `${victorias}`,                                                              label: "Victorias" },
              { val: esNuevo || !playerRatings?.avg_fair_play ? "—" : playerRatings.avg_fair_play.toFixed(1),    label: "Fair Play" },
            ].map((s) => (
              <div key={s.label} className="ph-card" style={{ textAlign: "center", padding: "14px 8px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, marginBottom: 4, color: s.val === "—" ? "var(--text2)" : "var(--text)" }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── Reputación ── */}
          {(playerRatings?.total ?? 0) > 0 && (
            <div className="ph-card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
                Reputación · {playerRatings!.total} valoraciones
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Fair Play",   val: playerRatings!.avg_fair_play   },
                  { label: "Puntualidad", val: playerRatings!.avg_punctuality },
                  { label: "Nivel",       val: playerRatings!.avg_skill_level },
                ].map(({ label, val }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <StarDisplay value={val} />
                    <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Evolución MMR ── */}
          <div className="ph-card" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Evolución MMR — Últimas 7 semanas
              </div>
              {!esNuevo && (
                <span
                  onClick={() => navigate("/perfil/mmr-historial")}
                  style={{ fontSize: 11, color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}
                >
                  Ver historial →
                </span>
              )}
            </div>
            {esNuevo || mmrChart.length === 0 ? (
              <div style={{ height: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <div style={{ fontSize: 24 }}>📈</div>
                <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "center" }}>
                  Tu evolución aparecerá aquí cuando juegues partidos
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                {mmrChart.map((v, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: "100%", height: `${(v / maxMMR) * 100}%`, background: i === mmrChart.length - 1 ? "var(--accent)" : "rgba(132,204,22,0.3)", borderRadius: "4px 4px 0 0" }} />
                    <span style={{ fontSize: 10, color: "var(--text2)" }}>{semanas[i]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Últimos partidos ── */}
          <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
            Últimos partidos
          </div>

          {esNuevo || lastMatches.length === 0 ? (
            <div className="ph-card" style={{ textAlign: "center", padding: "28px 16px", marginBottom: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🎾</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Sin partidos aún</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>
                Aquí aparecerán tus resultados cuando juegues partidos
              </div>
            </div>
          ) : (
            <div className="ph-card" style={{ marginBottom: 8 }}>
              {lastMatches.map((p, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < lastMatches.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.win ? "var(--green)" : "var(--red)", display: "inline-block", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{p.club ?? "Partido"}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>
                        {p.date ? new Date(p.date).toLocaleDateString("es-CL", { day: "2-digit", month: "short" }) : "—"}
                      </div>
                    </div>
                  </div>
                  <span className={`ph-pill ${p.win ? "ph-pill-green" : "ph-pill-red"}`} style={{ fontWeight: 700, fontSize: 12 }}>
                    {p.delta > 0 ? `+${p.delta}` : p.delta}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
      <NavBar />
    </div>
  );
}
