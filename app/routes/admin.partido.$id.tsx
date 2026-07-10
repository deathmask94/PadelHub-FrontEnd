import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import AdminRoute from "~/components/ui/AdminRoute";
import { adminFetch } from "~/services/adminAuth";

interface Player {
  id: string; name: string; rut: number; dv_rut: string; mmr: number; level: string;
}
interface MatchPlayer {
  id: string; team: string; status: string; joined_at: string; users: Player;
}
interface MatchResult {
  score_team_a: string; score_team_b: string; winner: string; registered_at: string;
  users: { name: string };
}
interface MMREntry {
  id: string; user_id: string; mmr_before: number; mmr_after: number; delta: number; calculated_at: string;
  users: { id: string; name: string };
}
interface AdminMatchDetail {
  id: string; club: string; format: string; status: string;
  match_date: string; match_time: string; created_at: string; updated_at: string;
  users: Player & { zone: string };
  match_players: MatchPlayer[];
  match_results: MatchResult | null;
  mmr_history: MMREntry[];
}

const STATUS_LABELS: Record<string, string> = {
  open: "Abierto", confirmed: "Confirmado", in_progress: "En juego",
  finished: "Finalizado", cancelled: "Cancelado",
};
const STATUS_COLORS: Record<string, string> = {
  open: "#60a5fa", confirmed: "var(--accent)", in_progress: "#facc15",
  finished: "var(--text2)", cancelled: "#ef4444",
};
const WINNER_LABELS: Record<string, string> = { team_a: "Equipo A", team_b: "Equipo B", draw: "Empate" };
const PLAYER_STATUS: Record<string, string> = {
  pending: "Pendiente", confirmed: "Confirmado", rejected: "Rechazado", removed: "Eliminado",
};
const NIVELES: Record<string, string> = {
  primera: "1ra", segunda: "2da", tercera: "3ra",
  cuarta: "4ta", quinta: "5ta", sexta: "6ta", septima_mas: "7ma+",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {children}
    </div>
  );
}

export default function AdminPartidoDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [match,   setMatch]   = useState<AdminMatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [annulling, setAnnulling] = useState(false);
  const [success,   setSuccess]   = useState("");
  const [forcingStatus, setForcingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    adminFetch<{ match: AdminMatchDetail }>(`/api/admin/matches/${id}`)
      .then(({ match: m }) => setMatch(m))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error al cargar el partido"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAnnulResult = async () => {
    if (!match) return;
    if (!confirm(
      `¿Seguro que deseas anular el resultado de "${match.club}" (${fmtDate(match.match_date)})?\n\nEsto revertirá los cambios de MMR de todos los jugadores y el partido volverá a estado "Confirmado".`
    )) return;

    setAnnulling(true); setError(""); setSuccess("");
    try {
      const res = await adminFetch<{ message: string; match: Partial<AdminMatchDetail> }>(
        `/api/admin/matches/${match.id}/annul-result`,
        { method: "POST" },
      );
      setMatch((prev) => prev ? { ...prev, ...res.match, match_results: null, mmr_history: [] } : prev);
      setSuccess(res.message);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al anular el resultado");
    } finally {
      setAnnulling(false);
    }
  };

  const handleForceStatus = async (status: string) => {
    if (!match) return;
    if (status === match.status) return;
    if (!confirm(
      `¿Forzar el estado de "${match.club}" de "${STATUS_LABELS[match.status]}" a "${STATUS_LABELS[status]}"?\n\nEsto NO toca resultados ni MMR, solo cambia el estado. Uso pensado para soporte/pruebas.`
    )) return;

    setForcingStatus(status); setError(""); setSuccess("");
    try {
      const res = await adminFetch<{ message: string; match: Partial<AdminMatchDetail> }>(
        `/api/admin/matches/${match.id}/set-status`,
        { method: "POST", body: JSON.stringify({ status }) },
      );
      setMatch((prev) => prev ? { ...prev, ...res.match } : prev);
      setSuccess(res.message);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cambiar el estado");
    } finally {
      setForcingStatus(null);
    }
  };

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
          <button onClick={() => navigate("/admin/partidos")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text2)", padding: 0 }}>
            ←
          </button>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Detalle del partido</span>
        </header>

        <main style={{ padding: "24px", maxWidth: 780, margin: "0 auto" }}>
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

          {match && (
            <>
              {/* Cabecera */}
              <div style={{
                background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px", marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>{match.club}</div>
                    <div style={{ fontSize: 13, color: "var(--text2)", display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <span>📅 {fmtDate(match.match_date)} · {fmtTime(match.match_time)}</span>
                      <span>{match.format === "doubles" ? "Dobles" : "Singles"}</span>
                      <span>Org: {match.users.name} · {match.users.zone}</span>
                    </div>
                  </div>
                  <div style={{
                    background: `${STATUS_COLORS[match.status]}22`,
                    border: `1px solid ${STATUS_COLORS[match.status]}55`,
                    borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600,
                    color: STATUS_COLORS[match.status],
                  }}>
                    {STATUS_LABELS[match.status] ?? match.status}
                  </div>
                </div>
              </div>

              {/* Jugadores */}
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
                <SectionTitle>JUGADORES INVITADOS ({match.match_players.length})</SectionTitle>
                {match.match_players.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--text2)" }}>Sin invitados</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {match.match_players.map((mp) => (
                      <div key={mp.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "var(--bg3)", borderRadius: 10, padding: "10px 14px",
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {mp.users.name}
                            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text2)", marginLeft: 8 }}>
                              {mp.users.rut}-{mp.users.dv_rut}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                            {NIVELES[mp.users.level] ?? mp.users.level} · {mp.users.mmr} MMR
                          </div>
                        </div>
                        <div style={{ textAlign: "right", fontSize: 12 }}>
                          <div style={{
                            color: mp.team === "team_a" ? "#60a5fa" : "#f472b6",
                            fontWeight: 600, marginBottom: 2,
                          }}>
                            {mp.team === "team_a" ? "Equipo A" : "Equipo B"}
                          </div>
                          <div style={{ color: "var(--text2)" }}>
                            {PLAYER_STATUS[mp.status] ?? mp.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resultado */}
              <div style={{ background: "var(--bg2)", border: `1px solid ${match.match_results ? "var(--border)" : "var(--border)"}`, borderRadius: 14, padding: "20px", marginBottom: 16 }}>
                <SectionTitle>RESULTADO</SectionTitle>
                {!match.match_results ? (
                  <div style={{ fontSize: 13, color: "var(--text2)" }}>Sin resultado registrado</div>
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 12 }}>
                      {match.match_results.score_team_a.split("-").map((a, i) => {
                        const b = match.match_results!.score_team_b.split("-")[i];
                        const aWins = Number(a) > Number(b);
                        return (
                          <div key={i} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>SET {i + 1}</div>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>
                              <span style={{ color: aWins ? "#60a5fa" : "var(--text2)" }}>{a}</span>
                              <span style={{ color: "var(--text2)" }}> – </span>
                              <span style={{ color: !aWins ? "#f472b6" : "var(--text2)" }}>{b}</span>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>GANADOR</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--accent)" }}>
                          {WINNER_LABELS[match.match_results.winner] ?? match.match_results.winner}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>
                      <span><span style={{ color: "#60a5fa" }}>●</span> Equipo A</span>
                      <span><span style={{ color: "#f472b6" }}>●</span> Equipo B</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>
                      Registrado por {match.match_results.users.name} · {fmtDate(match.match_results.registered_at)}
                    </div>
                  </div>
                )}
              </div>

              {/* Forzar estado (soporte/pruebas) */}
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
                <SectionTitle>FORZAR ESTADO DEL PARTIDO</SectionTitle>
                <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14, lineHeight: 1.5 }}>
                  Cambia el estado directamente, sin pasar por el flujo normal (unirse, confirmar, registrar resultado). No toca resultados ni MMR. Pensado para destrabar un partido o probar sin esperar la hora real.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleForceStatus(s)}
                      disabled={s === match.status || forcingStatus !== null}
                      style={{
                        padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${s === match.status ? STATUS_COLORS[s] : "var(--border)"}`,
                        background: s === match.status ? `${STATUS_COLORS[s]}22` : "var(--bg3)",
                        color: s === match.status ? STATUS_COLORS[s] : "var(--text2)",
                        cursor: s === match.status || forcingStatus !== null ? "not-allowed" : "pointer",
                        opacity: forcingStatus !== null && forcingStatus !== s ? 0.5 : 1,
                      }}
                    >
                      {forcingStatus === s ? "…" : STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Historial MMR */}
              {match.mmr_history.length > 0 && (
                <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
                  <SectionTitle>CAMBIOS DE MMR</SectionTitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {match.mmr_history.map((entry) => (
                      <div key={entry.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "var(--bg3)", borderRadius: 8, padding: "8px 14px", fontSize: 13,
                      }}>
                        <span style={{ fontWeight: 600 }}>{entry.users.name}</span>
                        <span style={{ color: "var(--text2)" }}>
                          {entry.mmr_before} → {entry.mmr_after}
                        </span>
                        <span style={{
                          fontWeight: 700, minWidth: 50, textAlign: "right",
                          color: entry.delta >= 0 ? "var(--accent)" : "#ef4444",
                        }}>
                          {entry.delta >= 0 ? "+" : ""}{entry.delta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Anular resultado */}
              {match.match_results && match.status === "finished" && (
                <div style={{
                  background: "var(--bg2)", border: "1px solid #ef444455",
                  borderRadius: 14, padding: "20px",
                }}>
                  <SectionTitle>ANULAR RESULTADO</SectionTitle>
                  <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, lineHeight: 1.5 }}>
                    Esta acción eliminará el resultado registrado y revertirá los cambios de MMR de todos los jugadores involucrados. El partido volverá al estado "Confirmado" para que se pueda registrar el resultado correcto.
                  </p>
                  <button
                    onClick={handleAnnulResult}
                    disabled={annulling}
                    style={{
                      background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444",
                      borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600,
                      color: "#ef4444", cursor: annulling ? "not-allowed" : "pointer",
                      opacity: annulling ? 0.6 : 1,
                    }}
                  >
                    {annulling ? "Anulando..." : "Anular resultado y revertir MMR"}
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
