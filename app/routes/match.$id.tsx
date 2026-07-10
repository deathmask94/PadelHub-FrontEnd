import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { apiFetch } from "~/services/auth";
import { joinMatch } from "~/services/matches";
import Avatar from "~/components/ui/Avatar";

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
  // La hora del partido es "hora de pared" (Chile), no un instante UTC que
  // deba reconvertirse a la zona horaria del navegador — se lee tal cual.
  const d = new Date(s);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

interface PlayerUser { id: string; name: string; photo_url: string | null; level: string; mmr: number; }
interface MatchPlayer { id: string; user_id: string; status: string; team: string; users: PlayerUser; }
interface MMRChange { id: string; before: number; after: number; delta: number; }

interface MatchDetail {
  id: string; club: string; format: string; status: string;
  match_date: string; match_time: string; ends_at?: string;
  organizer_id: string; is_organizer: boolean; my_status: string | null;
  max_players: number; can_rate: boolean; has_rated: boolean;
  is_ranked: boolean;
  users: PlayerUser;
  match_players: MatchPlayer[];
}

type RatingValues = { fair_play: number; punctuality: number; skill_level: number };

// Cada set guarda quien lo gano Y los games de cada equipo por separado,
// para que nunca sea ambiguo (antes un solo campo de texto por equipo
// dejaba adivinar quien gano el set con que numero).
interface SetResult { winner: "team_a" | "team_b" | ""; gamesA: string; gamesB: string }
const EMPTY_SET: SetResult = { winner: "", gamesA: "", gamesB: "" };
function isSetValid(s: SetResult) {
  if (s.winner === "" || !/^\d$/.test(s.gamesA) || !/^\d$/.test(s.gamesB)) return false;
  // El equipo marcado como ganador del set debe tener mas games que el
  // otro: sin este chequeo se puede marcar "Ganó B" con, por ejemplo,
  // 6-2 (A con mas games), guardando una inconsistencia sin avisar.
  const a = Number(s.gamesA), b = Number(s.gamesB);
  return s.winner === "team_a" ? a > b : b > a;
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ display: "flex", gap: 1 }}>
        {[1,2,3,4,5].map((n) => (
          <button key={n} onClick={() => onChange(n)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 20, lineHeight: 1, padding: "0 1px",
            color: n <= value ? "#facc15" : "var(--border)",
          }}>★</button>
        ))}
      </div>
    </div>
  );
}
interface SearchUser { id: string; name: string; username: string | null; photo_url: string | null; level: string; mmr: number; zone: string; }

const STATUS_LABEL: Record<string, string> = {
  open: "Abierto", confirmed: "Confirmado",
  in_progress: "En curso", finished: "Finalizado", cancelled: "Cancelado",
};

function PlayerAvatar({ user, size = 36 }: { user: { name: string; photo_url?: string | null }; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, background: "var(--accent)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontFamily: "var(--font-display)", fontWeight: 700,
      color: "#fff", overflow: "hidden", flexShrink: 0,
    }}>
      <Avatar photoUrl={user.photo_url} name={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
  const [inviteTeam,  setInviteTeam]  = useState<"" | "team_a" | "team_b">("");
  const [results,     setResults]     = useState<SearchUser[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [inviting,    setInviting]    = useState<string | null>(null);

  const [responding,  setResponding]  = useState(false);
  const [joining,     setJoining]     = useState(false);

  const [resultForm,  setResultForm]  = useState<{
    organizer_team: "team_a" | "team_b" | "";
    sets: SetResult[];
  }>({
    organizer_team: "",
    sets: [EMPTY_SET, EMPTY_SET, EMPTY_SET],
  });
  const [submittingResult, setSubmittingResult] = useState(false);
  const [mmrChanges,       setMmrChanges]       = useState<MMRChange[] | null>(null);

  const [confirmCancel,  setConfirmCancel]  = useState(false);
  const [confirmLeave,   setConfirmLeave]   = useState(false);
  const [actioning,      setActioning]      = useState(false);

  // Valoraciones
  const [ratings,         setRatings]         = useState<Record<string, RatingValues>>({});
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingDone,       setRatingDone]       = useState(false);

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

  // Al llegar a la pantalla de valoraciones, todos parten en 5 estrellas
  // (estilo Uber); el usuario solo baja las que quiera calificar peor.
  useEffect(() => {
    if (!match || match.status !== "finished" || match.has_rated) return;
    const toRate = [
      ...(match.is_organizer ? [] : [match.users]),
      ...match.match_players
        .filter((mp) => mp.status === "confirmed" && mp.users.id !== user?.id)
        .map((mp) => mp.users),
    ].filter((p) => p.id !== user?.id);
    setRatings((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const p of toRate) {
        if (!next[p.id]) { next[p.id] = { fair_play: 5, punctuality: 5, skill_level: 5 }; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [match, user?.id]);

  // Refresco automático: para no tener que recargar la página a mano
  // esperando a que el rival acepte o rechace el desafío.
  useEffect(() => {
    if (match && (match.status === "finished" || match.status === "cancelled")) return;
    const poll = setInterval(load, 5000);
    return () => clearInterval(poll);
  }, [load, match?.status]);

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
        body: JSON.stringify({ userId, ...(inviteTeam ? { team: inviteTeam } : {}) }),
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
      showToast("Partido cancelado.");
      setConfirmCancel(false);
      setTimeout(() => navigate("/home"), 1500);
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
      setTimeout(() => navigate("/home"), 1500);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al abandonar");
    } finally {
      setActioning(false);
    }
  };

  // En individual (1v1) no existe ambiguedad de equipo: el organizador es
  // simplemente "el otro" respecto de quien se unio. Preguntarle en que
  // equipo jugo es confuso y ademas puede chocar con el equipo que el
  // join ya le asigno automaticamente al rival, dejando los dos jugadores
  // en el mismo equipo y el resultado sin poder registrarse nunca.
  const isSinglesMatch = match?.format === "singles";
  const opponentEntry  = match?.match_players.find((p) => p.status === "confirmed");
  const autoOrganizerTeam: "team_a" | "team_b" | undefined =
    isSinglesMatch && opponentEntry
      ? (opponentEntry.team === "team_a" ? "team_b" : "team_a")
      : undefined;
  const effectiveOrganizerTeam = resultForm.organizer_team || autoOrganizerTeam || "";

  const setsToPlay = resultForm.sets.slice(0, 2).every((s) => isSetValid(s)) && resultForm.sets[0].winner === resultForm.sets[1].winner
    ? 2
    : 3;
  const playedSets = resultForm.sets.slice(0, setsToPlay);
  const allSetsValid = playedSets.every((s) => isSetValid(s));
  const setWins = playedSets.reduce(
    (acc, s) => (s.winner === "team_a" ? { ...acc, a: acc.a + 1 } : s.winner === "team_b" ? { ...acc, b: acc.b + 1 } : acc),
    { a: 0, b: 0 },
  );
  const matchWinner: "team_a" | "team_b" | "" = setWins.a === 2 ? "team_a" : setWins.b === 2 ? "team_b" : "";
  const canSubmitResult = !!effectiveOrganizerTeam && allSetsValid && !!matchWinner;

  const handleSubmitResult = async () => {
    if (!id || !canSubmitResult) return;
    setSubmittingResult(true);
    try {
      const data = await apiFetch<{ changes: MMRChange[] }>(`/api/matches/${id}/result`, {
        method: "POST",
        body: JSON.stringify({
          winner:         matchWinner,
          organizer_team: effectiveOrganizerTeam,
          score_team_a:   playedSets.map((s) => s.gamesA).join("-"),
          score_team_b:   playedSets.map((s) => s.gamesB).join("-"),
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

  const handleJoin = async () => {
    if (!id) return;
    setJoining(true);
    try {
      await joinMatch(id);
      showToast("¡Te has unido al partido!");
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error al unirse");
    } finally {
      setJoining(false);
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
      setTimeout(() => navigate("/home"), 1500);
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
  const canJoin      = !match.is_organizer && match.my_status === null && match.status === "open" && emptySlots > 0;

  // Si el organizador tiene el resultado pendiente, no puede salir de la
  // pantalla sin registrarlo (ni saltarselo): el partido quedaria "en
  // curso" para siempre y nadie mas puede registrar el resultado por el.
  const mustRegisterResult = match.is_organizer && (match.status === "in_progress" || match.status === "confirmed") && !mmrChanges;

  return (
    <div className="ph-screen">
      <div className="ph-scroll" style={{ padding: "0 0 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px" }}>
          <button
            className="ph-back-btn"
            onClick={() => mustRegisterResult ? showToast("Registra el resultado antes de salir") : navigate(-1)}
            style={mustRegisterResult ? { opacity: 0.35, cursor: "not-allowed" } : undefined}
          >
            ←
          </button>
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
                { icon: match.is_ranked ? "🏆" : "🎉", val: match.is_ranked ? "Competitivo — afecta MMR" : "Casual — no afecta MMR" },
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

          {/* Unirse a un cupo abierto — jugador no invitado */}
          {canJoin && (
            <div style={{
              background: "rgba(132,204,22,0.08)", border: "1px solid var(--border2)",
              borderRadius: 12, padding: "14px 16px", marginBottom: 16,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                🎾 Este partido tiene cupos abiertos
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
                ¿Quieres unirte?
              </div>
              <button
                onClick={handleJoin}
                disabled={joining}
                style={{
                  width: "100%", padding: "9px 0", borderRadius: 8, border: "none",
                  background: "var(--accent)", color: "#fff",
                  fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                {joining ? "Uniéndote…" : "Unirse al partido"}
              </button>
            </div>
          )}

          {/* Slots */}
          <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
            Jugadores ({filledSlots}/{maxPlayers})
          </div>

          <div className="ph-card" style={{ marginBottom: 16, padding: "8px 14px" }}>
            {/* Organizer */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <PlayerAvatar user={match.users} size={38} />
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
                <PlayerAvatar user={mp.users} size={38} />
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
                {match.format === "doubles" && (
                  <div style={{ marginBottom: 10 }}>
                    <label className="ph-label">Equipo (opcional)</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {([
                        { value: "" as const,        label: "Automático" },
                        { value: "team_a" as const,  label: "Equipo A" },
                        { value: "team_b" as const,  label: "Equipo B" },
                      ]).map((opt) => (
                        <button key={opt.label} type="button"
                          onClick={() => setInviteTeam(opt.value)}
                          className={`ph-format-opt${inviteTeam === opt.value ? " selected" : ""}`}
                          style={{ flex: 1, padding: "8px 0", fontSize: 12 }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <input
                  className="ph-input"
                  type="text"
                  placeholder="Buscar por @usuario…"
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
                    <PlayerAvatar user={u} size={34} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)" }}>
                        {u.username ? `${u.username} · ` : ""}{NIVEL_LABEL[u.level] ?? u.level} · {u.mmr} MMR · {u.zone}
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

                {/* Equipo del organizador: solo aplica en dobles. En individual
                    no hay ambiguedad (es directamente contra el otro jugador),
                    y preguntarlo podia chocar con el equipo que join.ts ya le
                    asigna al rival, dejando a los dos en el mismo equipo. */}
                {!isSinglesMatch && (
                  <>
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
                  </>
                )}

                {/* Sets: cada uno guarda quien lo gano Y los games de cada
                    equipo por separado, para que nunca quede la duda de
                    quien gano con que numero. El set 3 solo aparece si el
                    partido no quedo decidido 2-0 en los dos primeros. */}
                {resultForm.sets.slice(0, setsToPlay).map((set, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>SET {i + 1}</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      {(["team_a", "team_b"] as const).map((t) => (
                        <button key={t}
                          onClick={() => setResultForm((f) => {
                            const sets = [...f.sets];
                            sets[i] = { ...sets[i], winner: t };
                            return { ...f, sets };
                          })}
                          style={{
                            flex: 1, padding: "7px 0", borderRadius: 8, cursor: "pointer",
                            border: `1px solid ${set.winner === t ? "var(--accent)" : "var(--border)"}`,
                            background: set.winner === t ? "rgba(132,204,22,0.12)" : "var(--bg3)",
                            color: set.winner === t ? "var(--accent)" : "var(--text2)",
                            fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
                          }}
                        >
                          {t === "team_a" ? "Ganó A" : "Ganó B"}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <label className="ph-label" style={{ fontSize: 11 }}>Games Equipo A</label>
                        <input
                          className="ph-input" inputMode="numeric" maxLength={1} placeholder="0-9"
                          value={set.gamesA}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 1);
                            setResultForm((f) => {
                              const sets = [...f.sets];
                              sets[i] = { ...sets[i], gamesA: v };
                              return { ...f, sets };
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="ph-label" style={{ fontSize: 11 }}>Games Equipo B</label>
                        <input
                          className="ph-input" inputMode="numeric" maxLength={1} placeholder="0-9"
                          value={set.gamesB}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 1);
                            setResultForm((f) => {
                              const sets = [...f.sets];
                              sets[i] = { ...sets[i], gamesB: v };
                              return { ...f, sets };
                            });
                          }}
                        />
                      </div>
                    </div>
                    {set.winner !== "" && /^\d$/.test(set.gamesA) && /^\d$/.test(set.gamesB) && !isSetValid(set) && (
                      <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>
                        ⚠️ Marcaste "{set.winner === "team_a" ? "Ganó A" : "Ganó B"}" pero esos games no le dan la victoria a ese equipo.
                      </div>
                    )}
                  </div>
                ))}

                <button
                  className="ph-btn"
                  onClick={handleSubmitResult}
                  disabled={!canSubmitResult || submittingResult}
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
            match.my_status === "confirmed" && (
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

          {/* ── Valorar jugadores ── */}
          {match.status === "finished" && !ratingDone && (match.can_rate || match.has_rated) && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Valora tu experiencia
              </div>

              {match.has_rated ? (
                <div style={{
                  background: "rgba(132,204,22,0.08)", border: "1px solid var(--border2)",
                  borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "var(--accent)",
                }}>
                  ✓ Ya enviaste tus valoraciones para este partido.
                </div>
              ) : (() => {
                const toRate = [
                  ...(match.is_organizer ? [] : [match.users]),
                  ...match.match_players
                    .filter((mp) => mp.status === "confirmed" && mp.users.id !== user?.id)
                    .map((mp) => mp.users),
                ].filter((p) => p.id !== user?.id);

                const setRating = (playerId: string, field: keyof RatingValues, value: number) =>
                  setRatings((prev) => {
                    const base: RatingValues = prev[playerId] ?? { fair_play: 5, punctuality: 5, skill_level: 5 };
                    return { ...prev, [playerId]: { ...base, [field]: value } };
                  });

                const allRated = toRate.length > 0 && toRate.every((p) => ratings[p.id]);

                const handleSubmitRatings = async () => {
                  setSubmittingRating(true);
                  try {
                    await apiFetch(`/api/matches/${id}/rate`, {
                      method: "POST",
                      body: JSON.stringify({
                        ratings: toRate.map((p) => ({
                          rated_id:    p.id,
                          fair_play:   ratings[p.id]?.fair_play   ?? 5,
                          punctuality: ratings[p.id]?.punctuality ?? 5,
                          skill_level: ratings[p.id]?.skill_level ?? 5,
                        })),
                      }),
                    });
                    setRatingDone(true);
                    showToast("¡Valoraciones enviadas!");
                    navigate("/home");
                  } catch (e: unknown) {
                    showToast(e instanceof Error ? e.message : "Error al enviar valoraciones");
                  } finally {
                    setSubmittingRating(false);
                  }
                };

                return (
                  <div className="ph-card" style={{ marginBottom: 8 }}>
                    {toRate.map((p, i) => {
                      const r = ratings[p.id] ?? { fair_play: 5, punctuality: 5, skill_level: 5 };
                      return (
                        <div key={p.id} style={{
                          paddingBottom: 14, marginBottom: 14,
                          borderBottom: i < toRate.length - 1 ? "1px solid var(--border)" : "none",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <PlayerAvatar user={p} size={30} />
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                          </div>
                          <div style={{ display: "flex", gap: 10 }}>
                            <StarRating label="Fair play"   value={r.fair_play}   onChange={(v) => setRating(p.id, "fair_play", v)} />
                            <StarRating label="Puntualidad" value={r.punctuality} onChange={(v) => setRating(p.id, "punctuality", v)} />
                            <StarRating label="Nivel"       value={r.skill_level} onChange={(v) => setRating(p.id, "skill_level", v)} />
                          </div>
                        </div>
                      );
                    })}
                    <button
                      className="ph-btn"
                      onClick={handleSubmitRatings}
                      disabled={submittingRating || !allRated}
                      style={{ marginTop: 4 }}
                    >
                      {submittingRating ? "Enviando…" : "Enviar valoraciones"}
                    </button>
                    {!allRated && (
                      <div style={{ fontSize: 11, color: "var(--text2)", textAlign: "center", marginTop: 8 }}>
                        Selecciona al menos 1 estrella por jugador y dimensión
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>

      <div className={`ph-toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}
