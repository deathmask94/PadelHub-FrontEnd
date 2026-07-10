import { useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "~/context/AuthContext";
import { apiFetch, uploadProfilePhoto, deleteProfilePhoto } from "~/services/auth";
import NavBar from "~/components/ui/NavBar";
import Avatar from "~/components/ui/Avatar";

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
    setZona(user.zona ?? "");
    setReminderEnabled(user.reminder_enabled ?? true);
    setPhotoPreview(user.photo_url ?? null);
  }, [user?.rut]);

  const isDirty =
    zona            !== (user?.zona             ?? "") ||
    reminderEnabled !== (user?.reminder_enabled ?? true) ||
    photoFile !== null;

  const matchesPlayed = stats?.matches_played ?? 0;
  const victorias     = stats?.wins           ?? 0;
  const esNuevo       = matchesPlayed === 0;
  const lastMatches   = stats?.last_matches   ?? [];
  const mmrChart      = stats?.mmr_chart      ?? [];
  const semanas       = mmrChart.map((_, i) => `P${i + 1}`);

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
    setSaving(true);
    try {
      if (photoFile && user) {
        setUploadingPhoto(true);
        await uploadProfilePhoto(user.rut, photoFile);
        setUploadingPhoto(false);
        setPhotoFile(null);
      }
      await editarPerfil({ zona, reminder_enabled: reminderEnabled });
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
                  <Avatar
                    photoUrl={photoPreview}
                    name={user?.nombre ?? ""}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                  />
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
              <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800, textTransform: "uppercase", lineHeight: 1.2, marginBottom: 8, wordBreak: "break-word" }}>
                {user?.nombre ?? "—"}
              </div>
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
              <div style={{ height: 96, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <div style={{ fontSize: 28 }}>📈</div>
                <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "center" }}>
                  Tu evolución aparecerá aquí cuando juegues partidos
                </div>
              </div>
            ) : (() => {
              const W = 300, H = 110;
              const padL = 6, padR = 6, padT = 10, padB = 24;
              const cW = W - padL - padR;
              const cH = H - padT - padB;
              const minV = Math.min(...mmrChart);
              const maxV = Math.max(...mmrChart);
              const range = (maxV - minV) || 80;
              const vMin = minV - range * 0.15;
              const vMax = maxV + range * 0.15;
              const vRange = vMax - vMin;
              const n = mmrChart.length;
              const pts = mmrChart.map((v, i) => ({
                x: padL + (n === 1 ? cW / 2 : (i / (n - 1)) * cW),
                y: padT + (1 - (v - vMin) / vRange) * cH,
              }));
              const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
              const area = `${line} L${pts[n-1].x.toFixed(1)},${(padT + cH).toFixed(1)} L${pts[0].x.toFixed(1)},${(padT + cH).toFixed(1)} Z`;
              const last = pts[n - 1];
              return (
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} aria-hidden>
                  <defs>
                    <linearGradient id="mmr-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#84cc16" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#84cc16" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[0.25, 0.5, 0.75].map((f) => (
                    <line key={f} x1={padL} y1={padT + f * cH} x2={W - padR} y2={padT + f * cH}
                      stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  ))}
                  {/* Area fill */}
                  <path d={area} fill="url(#mmr-grad)" />
                  {/* Line */}
                  <path d={line} fill="none" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Dots */}
                  {pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={i === n - 1 ? 4 : 2.5}
                      fill={i === n - 1 ? "#84cc16" : "rgba(132,204,22,0.5)"}
                      stroke={i === n - 1 ? "var(--bg, #1a1a1a)" : "none"}
                      strokeWidth="2" />
                  ))}
                  {/* Last value label */}
                  <text x={last.x} y={last.y - 8} textAnchor="middle"
                    fontSize="9" fontWeight="700" fill="#84cc16">
                    {mmrChart[n - 1]}
                  </text>
                  {/* Week labels */}
                  {pts.map((p, i) => (
                    <text key={i} x={p.x} y={H - 4} textAnchor="middle"
                      fontSize="8.5" fill="rgba(150,150,150,0.8)">
                      {semanas[i]}
                    </text>
                  ))}
                </svg>
              );
            })()}
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
