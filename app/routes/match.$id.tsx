import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { apiFetch } from "~/services/auth";

const DIAS  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const NIVEL_LABEL: Record<string, string> = {
  primera: "1ra", segunda: "2da", tercera: "3ra",
  cuarta: "4ta", quinta: "5ta", sexta: "6ta", septima_mas: "7ma+",
};
const LEVELS = ["primera","segunda","tercera","cuarta","quinta","sexta","septima_mas"];

function formatDate(s: string) {
  const d = new Date(s);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}
function formatTime(s: string) {
  return new Date(s).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
}

interface PlayerUser { id: string; name: string; photo_url: string | null; level: string; mmr: number; }
interface MatchPlayer { id: string; user_id: string; status: string; team: string; users: PlayerUser; }
interface MMRChange { id: string; before: number; after: number; delta: number; }

interface MatchDetail {
  id: string; club: string; format: string; status: string;
  match_date: string; match_time: string; ends_at?: string;
  organizer_id: string; is_organizer: boolean; my_status: string | null;
  max_players: number;
  users: PlayerUser;
  match_players: MatchPlayer[];
}
interface SearchUser { id: string; name: string; photo_url: string | null; level: string; mmr: number; zone: string; }

const STATUS_LABEL: Record<string, string> = {
  open: "Abierto", confirmed: "Confirmado",
  in_progress: "En curso", finished: "Finalizado", cancelled: "Cancelado",
};

function Avatar({ user, size = 36 }: { user: { name: string; photo_url?: string | null }; size?: number }) {
  const initials = user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, background: "var(--accent)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontFamily: "var(--font-display)", fontWeight: 700,
      color: "#fff", overflow: "hidden", flexShrink: 0,
    }}>
      {user.photo_url
        ? <img src={user.photo_url} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
    </div>
  );
}

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [match,       setMatch]       = useState<MatchDetail | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [toast,       setToast]       = useState("");

  const [searchQ,     setSearchQ]     = useState("");
  const [searchLevel, setSearchLevel] = useState("");
  const [results,     setResults]     = useState<SearchUser[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [inviting,    setInviting]    = useState<string | null>(null);

  const [responding,  setResponding]  = useState(false);

  const [resultForm,  setResultForm]  = useState({
    organizer_team: "" as "team_a" | "team_b" | "",
    winner:         "" as "team_a" | "team_b" | "draw" | "",
    score_a:        "",
    score_b:        "",
  });
  const [submittingResult, setSubmittingResult] = useState(false);
  const [mmrChanges,       setMmrChanges]       = useState<MMRChange[] | null>(null);

  const [confirmCancel,  setConfirmCancel]  = useState(false);
  const [confirmLeave,   setConfirmLeave]   = useState(false);
  const [actioning,      setActioning]      = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiFetch<MatchDetail>(`/api/matches/${id}`);
      setMatch(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar el partido");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchQ.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const qs = `?q=${encodeURIComponent(searchQ)}${searchLevel ? `&level=${searchLevel}` : ""}`;
        const data = await apiFetch<SearchUser[]>(`/api/users/search${qs}`);
        const alreadyIn = new Set([
          match?.organizer_id,
          ...(match?.match_players.map((p) => p.user_id) ?? []),
        ]);
        setResults(data.filter((u) => !alreadyIn.has(u.id)));
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ, searchLevel, match]);

  const handleInvite = async (userId: string) => {
    if (!id) return;
    setInviting(userId);
    try {
      await apiFetch(`/api/matches/${id}/invite`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      showToast("Invitación enviada");
      setSearchQ(""); setResults([]);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al invitar");
    } finally {
      setInviting(null);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setActioning(true);
    try {
      await apiFetch(`/api/matches/${id}/cancel`, { method: "POST" });
      showToast("Partido cancelado. Se notificó a los jugadores.");
      setConfirmCancel(false);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al cancelar");
    } finally {
      setActioning(false);
    }
  };

  const handleLeave = async () => {
    if (!id) return;
    setActioning(true);
    try {
      await apiFetch(`/api/matches/${id}/leave`, { method: "POST" });
      showToast("Has abandonado el partido.");
      setConfirmLeave(false);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al abandonar");
    } finally {
      setActioning(false);
    }
  };

  const handleSubmitResult = async () => {
    if (!id || !resultForm.organizer_team || !resultForm.winner) return;
    setSubmittingResult(true);
    try {
      const data = await apiFetch<{ changes: MMRChange[] }>(`/api/matches/${id}/result`, {
        method: "POST",
        body: JSON.stringify({
          winner:         resultForm.winner,
          organizer_team: resultForm.organizer_team,
          score_team_a:   resultForm.score_a || undefined,
          score_team_b:   resultForm.score_b || undefined,
        }),
      });
      setMmrChanges(data.changes);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al registrar resultado");
    } finally {
      setSubmittingResult(false);
    }
  };

  const handleRespond = async (accept: boolean) => {
    if (!id) return;
    setResponding(true);
    try {
      await apiFetch(`/api/matches/${id}/respond`, {
        method: "POST",
        body: JSON.stringify({ accept }),
      });
      showToast(accept ? "¡Te has unido al partido!" : "Invitación rechazada");
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al responder");
    } finally {
      setResponding(false);
    }
  };

  if (loading) return (
    <div className="ph-screen" style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ color: "var(--text2)", fontSize: 14 }}>Cargando…</div>
    </div>
  );

  if (error || !match) return (
    <div className="ph-screen" style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="ph-error">{error || "Partido no encontrado"}</div>
    </div>
  );

  const maxPlayers   = match.max_players;
  const activePlayers = match.match_players.filter((p) => p.status !== "rejected");
  const filledSlots  = 1 + activePlayers.length; // organizer + players
  const emptySlots   = maxPlayers - filledSlots;
  const canInvite    = match.is_organizer && match.status === "open" && emptySlots > 0;

  return (
    <div className="ph-screen">
      <div className="ph-scroll" style={{ padding: "0 0 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px" }}>
          <button className="ph-back-btn" onClick={() => navigate(-1)}>←</button>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700 }}>Detalle del partido</div>
          <span className="ph-pill ph-pill-green" style={{ fontSize: 11 }}>
            {STATUS_LABEL[match.status] ?? match.status}
          </span>
        </div>

        <div style={{ padding: "0 20px" }}>

          {/* Info card */}
          <div className="ph-card" style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
              {match.club}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { icon: "📅", val: formatDate(match.match_date) },
                { icon: "⏰", val: formatTime(match.match_time) },
                { icon: "🎾", val: match.format === "doubles" ? "Dobles (2v2)" : "Individual (1v1)" },
                { icon: "👥", val: `${filledSlots}/${maxPlayers} jugadores` },
              ].map((item) => (
                <div key={item.icon} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text2)" }}>
                  <span>{item.icon}</span><span>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending invitation banner */}
          {match.my_status === "pending" && (
            <div style={{
              background: "rgba(132,204,22,0.08)", border: "1px solid var(--border2)",
              borderRadius: 12, padding: "14px 16px", marginBottom: 16,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                🎾 Has sido invitado a este partido
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
                ¿Quieres unirte?
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleRespond(true)}
                  disabled={responding}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                    background: "var(--accent)", color: "#fff",
                    fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {responding ? "…" : "✓ Aceptar"}
                </button>
                <button
                  onClick={() => handleRespond(false)}
                  disabled={responding}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 8,
                    border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)",
                    color: "#fca5a5", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {responding ? "…" : "✕ Rechazar"}
                </button>
              </div>
            </div>
          )}

          {/* Slots */}
          <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
            Jugadores ({filledSlots}/{maxPlayers})
          </div>

          <div className="ph-card" style={{ marginBottom: 16, padding: "8px 14px" }}>
            {/* Organizer */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <Avatar user={match.users} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{match.users.name}</div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>
                  {NIVEL_LABEL[match.users.level] ?? match.users.level} · {match.users.mmr} MMR
                </div>
              </div>
              <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>Organizador</span>
            </div>

            {/* Joined players */}
            {activePlayers.map((mp, i) => (
              <div
                key={mp.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                  borderBottom: i < activePlayers.length - 1 || emptySlots > 0 ? "1px solid var(--border)" : "none",
                }}
              >
                <Avatar user={mp.users} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{mp.users.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>
                    {NIVEL_LABEL[mp.users.level] ?? mp.users.level} · {mp.users.mmr} MMR
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: mp.status === "confirmed" ? "var(--accent)" : "var(--text2)",
                }}>
                  {mp.status === "confirmed" ? "✓ Confirmado" : "⏳ Pendiente"}
                </span>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                  borderBottom: i < emptySlots - 1 ? "1px solid var(--border)" : "none",
                  opacity: 0.5,
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 38 * 0.28,
                  border: "2px dashed var(--border)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 18, color: "var(--text2)",
                }}>+</div>
                <div style={{ fontSize: 13, color: "var(--text2)" }}>Slot libre</div>
              </div>
            ))}
          </div>

          {/* Invite panel — organizer only */}
          {canInvite && (
            <>
              <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Invitar jugador
              </div>
              <div className="ph-card" style={{ marginBottom: 16 }}>
                <input
                  className="ph-input"
                  type="text"
                  placeholder="Buscar por nombre…"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                <select
                  className="ph-select"
                  value={searchLevel}
                  onChange={(e) => setSearchLevel(e.target.value)}
                  style={{ marginBottom: 10 }}
                >
                  <option value="">Todos los niveles</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{NIVEL_LABEL[l]} Categoría</option>
                  ))}
                </select>

                {searching && <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "center", padding: "8px 0" }}>Buscando…</div>}

                {!searching && searchQ.length >= 2 && results.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "center", padding: "8px 0" }}>
                    Sin resultados
                  </div>
                )}

                {results.map((u, i) => (
                  <div
                    key={u.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 0",
                      borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                    }}
                  >
                    <Avatar user={u} size={34} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)" }}>
                        {NIVEL_LABEL[u.level] ?? u.level} · {u.mmr} MMR · {u.zone}
                      </div>
                    </div>
                    <button
                      onClick={() => handleInvite(u.id)}
                      disabled={inviting === u.id}
                      style={{
                        padding: "6px 12px", borderRadius: 8, border: "none",
                        background: "rgba(132,204,22,0.12)", color: "var(--accent)",
                        fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {inviting === u.id ? "…" : "Invitar"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {match.is_organizer && match.status === "open" && emptySlots === 0 && (
            <div style={{
              background: "rgba(132,204,22,0.08)", border: "1px solid var(--border2)",
              borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "var(--accent)",
            }}>
              ✅ Todos los cupos están ocupados. El partido se confirmará cuando todos acepten.
            </div>
          )}

          {/* ── Resultado ── */}
          {match.is_organizer && (match.status === "in_progress" || match.status === "confirmed") && !mmrChanges && (
            <>
              <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, marginTop: 8 }}>
                Registrar resultado
              </div>
              <div className="ph-card" style={{ marginBottom: 16 }}>

                {/* Equipo del organizador */}
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>¿En qué equipo jugaste?</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {(["team_a", "team_b"] as const).map((t) => (
                    <button key={t}
                      onClick={() => setResultForm((f) => ({ ...f, organizer_team: t }))}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                        border: `1px solid ${resultForm.organizer_team === t ? "var(--accent)" : "var(--border)"}`,
                        background: resultForm.organizer_team === t ? "rgba(132,204,22,0.12)" : "var(--bg3)",
                        color: resultForm.organizer_team === t ? "var(--accent)" : "var(--text2)",
                        fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
                      }}
                    >
                      {t === "team_a" ? "Equipo A" : "Equipo B"}
                    </button>
                  ))}
                </div>

                {/* Ganador */}
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>¿Quién ganó?</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {([
                    { val: "team_a", label: "Eq. A ganó" },
                    { val: "team_b", label: "Eq. B ganó" },
                    { val: "draw",   label: "Empate"     },
                  ] as const).map(({ val, label }) => (
                    <button key={val}
                      onClick={() => setResultForm((f) => ({ ...f, winner: val }))}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                        border: `1px solid ${resultForm.winner === val ? "var(--accent)" : "var(--border)"}`,
                        background: resultForm.winner === val ? "rgba(132,204,22,0.12)" : "var(--bg3)",
                        color: resultForm.winner === val ? "var(--accent)" : "var(--text2)",
                        fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Score opcional */}
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>Score (opcional)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  <div>
                    <label className="ph-label" style={{ fontSize: 11 }}>Equipo A</label>
                    <input className="ph-input" placeholder="ej. 6-3" value={resultForm.score_a}
                      onChange={(e) => setResultForm((f) => ({ ...f, score_a: e.target.value }))} />
                  </div>
                  <div>
                    <label className="ph-label" style={{ fontSize: 11 }}>Equipo B</label>
                    <input className="ph-input" placeholder="ej. 3-6" value={resultForm.score_b}
                      onChange={(e) => setResultForm((f) => ({ ...f, score_b: e.target.value }))} />
                  </div>
                </div>

                <button
                  className="ph-btn"
                  onClick={handleSubmitResult}
                  disabled={!resultForm.organizer_team || !resultForm.winner || submittingResult}
                >
                  {submittingResult ? "Registrando…" : "Registrar resultado"}
                </button>
              </div>
            </>
          )}

          {/* ── Resultado registrado: cambios de MMR ── */}
          {mmrChanges && (
            <>
              <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, marginTop: 8 }}>
                Resultado registrado
              </div>
              <div className="ph-card" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--accent)" }}>
                  ✅ Partido finalizado
                </div>
                {mmrChanges.map((c) => {
                  const player = c.id === match.users.id
                    ? match.users
                    : match.match_players.find((p) => p.users.id === c.id)?.users;
                  return (
                    <div key={c.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 0", borderBottom: "1px solid var(--border)",
                    }}>
                      <div style={{ fontSize: 13 }}>{player?.name ?? "Jugador"}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "var(--text2)" }}>{c.before}</span>
                        <span style={{ fontSize: 12, color: c.delta >= 0 ? "var(--accent)" : "#fca5a5", fontWeight: 700 }}>
                          {c.delta >= 0 ? `+${c.delta}` : c.delta}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{c.after}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Cancelar partido (organizador) ── */}
          {match.is_organizer && !["finished", "cancelled"].includes(match.status) && (
            <div style={{ marginTop: 8 }}>
              {!confirmCancel ? (
                <button
                  onClick={() => setConfirmCancel(true)}
                  style={{
                    width: "100%", padding: "11px 0", borderRadius: 10, cursor: "pointer",
                    border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)",
                    color: "#fca5a5", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
                  }}
                >
                  Cancelar partido
                </button>
              ) : (
                <div style={{
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 12, padding: "14px 16px",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fca5a5", marginBottom: 6 }}>
                    ¿Cancelar este partido?
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
                    Se notificará por correo a todos los jugadores inscritos.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleCancel}
                      disabled={actioning}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                        background: "rgba(239,68,68,0.8)", color: "#fff",
                        fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {actioning ? "…" : "Sí, cancelar"}
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      disabled={actioning}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 8,
                        border: "1px solid var(--border)", background: "var(--bg3)",
                        color: "var(--text2)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      No, volver
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Abandonar partido (jugador) ── */}
          {!match.is_organizer &&
            ["open", "confirmed"].includes(match.status) &&
            (match.my_status === "confirmed" || match.my_status === "pending") && (
            <div style={{ marginTop: 8 }}>
              {!confirmLeave ? (
                <button
                  onClick={() => setConfirmLeave(true)}
                  style={{
                    width: "100%", padding: "11px 0", borderRadius: 10, cursor: "pointer",
                    border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)",
                    color: "#fca5a5", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
                  }}
                >
                  Abandonar partido
                </button>
              ) : (
                <div style={{
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 12, padding: "14px 16px",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fca5a5", marginBottom: 6 }}>
                    ¿Abandonar este partido?
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
                    Tu cupo quedará libre para otro jugador.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleLeave}
                      disabled={actioning}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                        background: "rgba(239,68,68,0.8)", color: "#fff",
                        fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {actioning ? "…" : "Sí, abandonar"}
                    </button>
                    <button
                      onClick={() => setConfirmLeave(false)}
                      disabled={actioning}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 8,
                        border: "1px solid var(--border)", background: "var(--bg3)",
                        color: "var(--text2)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      No, volver
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <div className={`ph-toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}
