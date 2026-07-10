import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useNotifications } from "~/context/NotificationsContext";
import NavBar from "~/components/ui/NavBar";
import Avatar from "~/components/ui/Avatar";
import { getMatches, getMyMatches, respondInvitation, type Match, type MatchFilters } from "~/services/matches";

const DIAS  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const NIVEL_LABEL: Record<string, string> = {
  primera: "1ra", segunda: "2da", tercera: "3ra",
  cuarta: "4ta", quinta: "5ta", sexta: "6ta", septima_mas: "7ma+",
};
const ZONAS = ["Valparaíso","Viña del Mar","Quilpué","Villa Alemana","Concón"];

function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const d = new Date(timeStr);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

const STATUS_LABEL: Record<string, string> = {
  open: "Abierto", confirmed: "En curso",
  in_progress: "En curso", finished: "Finalizado", cancelled: "Cancelado",
};

const STATUS_CLASS: Record<string, string> = {
  open: "ph-pill-green", confirmed: "ph-pill-green",
  in_progress: "ph-pill-green", finished: "ph-pill-gray", cancelled: "ph-pill-red",
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [matches,      setMatches]      = useState<Match[]>([]);
  const [myMatches,    setMyMatches]    = useState<Match[]>([]);
  const [loadingM,     setLoadingM]     = useState(true);
  const [errorM,       setErrorM]       = useState("");
  const [activeTab,    setActiveTab]    = useState<'all' | 'mine'>('all');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [filters,      setFilters]      = useState<MatchFilters>({ zone: "", format: undefined, date: undefined });
  const { unreadCount } = useNotifications();

  const fetchMatches = useCallback(async (opts?: { silent?: boolean }) => {
    const activeFilters: MatchFilters = {
      zone:   filters.zone   || undefined,
      format: filters.format || undefined,
      date:   filters.date   || undefined,
    };
    if (!opts?.silent) setLoadingM(true);
    try {
      const [all, mine] = await Promise.all([getMatches(activeFilters), getMyMatches()]);
      setMatches(all); setMyMatches(mine);
    } catch (e: unknown) {
      if (!opts?.silent) setErrorM(e instanceof Error ? e.message : 'Error al cargar los partidos');
    } finally {
      if (!opts?.silent) setLoadingM(false);
    }
  }, [filters]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  // Refresco automático: para ver aceptaciones/rechazos de desafíos
  // sin tener que recargar la página a mano.
  useEffect(() => {
    const poll = setInterval(() => fetchMatches({ silent: true }), 5000);
    return () => clearInterval(poll);
  }, [fetchMatches]);

  const handleRespond = async (matchId: string, accept: boolean) => {
    setRespondingId(matchId);
    try { await respondInvitation(matchId, accept); await fetchMatches({ silent: true }); }
    catch (e: unknown) { setErrorM(e instanceof Error ? e.message : 'Error al responder'); }
    finally { setRespondingId(null); }
  };

  const proximoPartido =
    myMatches.find((m) => m.status === "open" || m.status === "confirmed") ??
    null;

  // Partido propio que ya empezo (el backend lo pasa a in_progress solo
  // cuando la hora real llego) y todavia no tiene resultado registrado:
  // mientras no se registre, el partido nunca pasa a "finalizado" y nadie
  // mas puede hacerlo por el organizador.
  const pendingResultMatch = myMatches.find(
    (m) => m.organizer_id === user?.id && m.status === "in_progress",
  );

  // Invitaciones a las que todavia no respondiste -- se muestran arriba de
  // todo, sin depender de que encuentres la pestaña "Mis partidos".
  const pendingInvites = myMatches.filter((m) => {
    const myEntry = (m as Match & { match_players?: { user_id: string; status: string }[] })
      .match_players?.find((p) => p.user_id === user?.id);
    return myEntry?.status === "pending";
  });

  return (
    <div className="ph-screen">
      <div className="ph-scroll" style={{ padding: "20px 20px 0" }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>
              Hola, {user?.nombre?.split(" ")[0]} 👋
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>
              {user?.zona ? `${user.zona} · ` : ""}MMR {user?.mmr ?? 1000}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Campana notificaciones */}
            <button
              onClick={() => navigate("/notificaciones")}
              style={{
                position: "relative", background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: 12, width: 40, height: 40, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "#ef4444", color: "#fff", borderRadius: "50%",
                  minWidth: 16, height: 16, fontSize: 9, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px",
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {/* Avatar perfil */}
            <button
              onClick={() => navigate("/perfil")}
              style={{
                width: 44, height: 44, background: "var(--accent)", borderRadius: 14,
                border: "none", cursor: "pointer", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "#fff",
              }}
            >
              <Avatar
                photoUrl={user?.photo_url}
                name={user?.nombre ?? ""}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </button>
          </div>
        </div>

        {/* ── Invitaciones pendientes ── */}
        {pendingInvites.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, fontWeight: 700 }}>
              🎾 Invitaciones pendientes ({pendingInvites.length})
            </div>
            {pendingInvites.map((m) => {
              const isResponding = respondingId === m.id;
              return (
                <div
                  key={m.id}
                  style={{
                    background: "rgba(132,204,22,0.08)", border: "1px solid var(--border2)",
                    borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer",
                  }}
                  onClick={() => navigate(`/matches/${m.id}`)}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{m.club}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
                    {formatMatchDate(m.match_date)} · {formatTime(m.match_time)} · {m.format === "doubles" ? "Dobles" : "Individual"}
                  </div>
                  <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleRespond(m.id, true)}
                      disabled={isResponding}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                        background: "var(--accent)", color: "#fff",
                        fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {isResponding ? "…" : "✓ Aceptar"}
                    </button>
                    <button
                      onClick={() => handleRespond(m.id, false)}
                      disabled={isResponding}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 8,
                        border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)",
                        color: "#fca5a5", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {isResponding ? "…" : "✕ Rechazar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Aviso de resultado pendiente ── */}
        {pendingResultMatch && (
          <div
            onClick={() => navigate(`/matches/${pendingResultMatch.id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
              background: "rgba(250,204,21,0.1)", border: "1px solid #facc15",
              borderRadius: 12, padding: "12px 14px", marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#facc15" }}>
                Tienes un resultado pendiente de registrar
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>
                {pendingResultMatch.club} · Toca para registrarlo
              </div>
            </div>
            <span style={{ color: "#facc15", fontSize: 16 }}>→</span>
          </div>
        )}

        {/* ── MMR card ── */}
        <div className="ph-mmr-bar" style={{ marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
              Tu MMR
            </div>
            <div className="ph-mmr-num">{user?.mmr ?? 1000}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
              Juega partidos para subir en el ranking
            </div>
          </div>
          <div className="ph-bars-chart">
            {[30, 45, 35, 55, 48, 65, 80].map((h, i) => (
              <div key={i} className="ph-bar" style={{
                height: `${h}%`,
                background: i === 6 ? "var(--accent)" : "rgba(132,204,22,0.3)",
              }} />
            ))}
          </div>
        </div>

        {/* ── Próximo partido ── */}
        <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
          Próximo partido
        </div>

        {loadingM ? (
          <div className="ph-card" style={{ marginBottom: 20, textAlign: "center", padding: "20px", color: "var(--text2)", fontSize: 13 }}>
            Cargando…
          </div>
        ) : proximoPartido ? (
          <div
            className="ph-upcoming-card"
            style={{ marginBottom: 20, cursor: "pointer" }}
            onClick={() => navigate(`/matches/${proximoPartido.id}`)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className={`ph-pill ${STATUS_CLASS[proximoPartido.status] ?? "ph-pill-gray"}`}>
                {STATUS_LABEL[proximoPartido.status]}
              </span>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>
                {formatMatchDate(proximoPartido.match_date)}
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
              {proximoPartido.club}
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>
              {formatTime(proximoPartido.match_time)} · {proximoPartido.format === "doubles" ? "Dobles" : "Individual"}
            </div>
            <span className="ph-pill" style={{
              fontSize: 10,
              background: proximoPartido.is_ranked ? "rgba(132,204,22,0.1)" : "var(--bg3)",
              color: proximoPartido.is_ranked ? "var(--accent)" : "var(--text2)",
              border: `1px solid ${proximoPartido.is_ranked ? "var(--border2)" : "var(--border)"}`,
            }}>
              {proximoPartido.is_ranked ? "🏆 Competitivo" : "🎉 Casual"}
            </span>
          </div>
        ) : (
          <div
            className="ph-card"
            style={{ marginBottom: 20, textAlign: "center", padding: "20px 16px", border: "1px dashed var(--border)" }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎾</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Sin partido próximo</div>
          </div>
        )}

        {/* ── Acciones rápidas ── */}
        <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
          Acciones rápidas
        </div>
        <div className="ph-quick-grid" style={{ marginBottom: 20 }}>
          {[
            { icon: "🏓", title: "Crear partido", sub: "Organiza un juego", path: "/crear"       },
            { icon: "🎯", title: "Buscar rival",  sub: "Matchmaking MMR",   path: "/matchmaking" },
          ].map((a) => (
            <div key={a.title} className="ph-quick-card" onClick={() => navigate(a.path)}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>{a.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs de partidos ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {(['all', 'mine'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
              fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: activeTab === tab ? "var(--accent)" : "var(--bg3)",
              color:      activeTab === tab ? "#fff"          : "var(--text2)",
              transition: "all .2s",
            }}>
              {tab === 'all' ? 'Disponibles' : 'Mis partidos'}
            </button>
          ))}
        </div>

        {/* ── Filtros (solo en tab Disponibles) ── */}
        {activeTab === 'all' && (
          <div style={{ marginBottom: 12 }}>
            {/* Zona */}
            <select
              value={filters.zone ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, zone: e.target.value }))}
              className="ph-select"
              style={{ marginBottom: 8, fontSize: 12 }}
            >
              <option value="">Todas las zonas</option>
              {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>

            {/* Formato + Fecha en fila */}
            <div style={{ display: "flex", gap: 6 }}>
              {/* Formato */}
              <div style={{ display: "flex", flex: 1, gap: 4 }}>
                {([
                  { val: undefined,   label: "Todos"     },
                  { val: "doubles",   label: "Dobles"    },
                  { val: "singles",   label: "Individual"},
                ] as { val: 'doubles' | 'singles' | undefined; label: string }[]).map(({ val, label }) => (
                  <button key={label}
                    onClick={() => setFilters((f) => ({ ...f, format: val }))}
                    style={{
                      flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid var(--border)",
                      fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, cursor: "pointer",
                      background: filters.format === val ? "rgba(132,204,22,0.12)" : "var(--bg3)",
                      color:      filters.format === val ? "var(--accent)"          : "var(--text2)",
                      transition: "all .15s",
                    }}
                  >{label}</button>
                ))}
              </div>

              {/* Fecha */}
              <div style={{ display: "flex", flex: 1, gap: 4 }}>
                {([
                  { val: undefined, label: "Siempre" },
                  { val: "today",   label: "Hoy"     },
                  { val: "week",    label: "7 días"  },
                ] as { val: 'today' | 'week' | undefined; label: string }[]).map(({ val, label }) => (
                  <button key={label}
                    onClick={() => setFilters((f) => ({ ...f, date: val }))}
                    style={{
                      flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid var(--border)",
                      fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, cursor: "pointer",
                      background: filters.date === val ? "rgba(132,204,22,0.12)" : "var(--bg3)",
                      color:      filters.date === val ? "var(--accent)"          : "var(--text2)",
                      transition: "all .15s",
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {errorM && <div className="ph-error">{errorM}</div>}

        {loadingM && (
          <div className="ph-card" style={{ textAlign: "center", padding: "20px", color: "var(--text2)", fontSize: 13, marginBottom: 8 }}>
            Cargando…
          </div>
        )}

        {!loadingM && activeTab === 'all' && (
          <>
            {matches.length === 0 && !errorM ? (
              <div className="ph-card" style={{ textAlign: "center", padding: "24px 16px", marginBottom: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎾</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Sin partidos disponibles</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>Sé el primero en crear uno</div>
              </div>
            ) : (
              matches.slice(0, 10).map((m) => {
                const isOrganizer = m.organizer_id === user?.id;
                const isJoining   = false;
                const total       = m.max_players ?? (m.format === "doubles" ? 4 : 2);
                const filled      = m.player_count ?? 1;
                return (
                  <div
                    key={m.id} className="ph-card"
                    style={{ marginBottom: 8, padding: "12px 14px", cursor: "pointer" }}
                    onClick={() => navigate(`/matches/${m.id}`)}
                  >
                    {/* Fila 1: club + status */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{m.club}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {m.is_ranked ? (
                          <span className="ph-pill" style={{ fontSize: 10, background: "rgba(132,204,22,0.1)", color: "var(--accent)", border: "1px solid var(--border2)" }}>
                            🏆 Competitivo
                          </span>
                        ) : (
                          <span className="ph-pill" style={{ fontSize: 10, background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)" }}>
                            🎉 Casual
                          </span>
                        )}
                        {m.gender_preference && (
                          <span className="ph-pill" style={{ fontSize: 10, background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)" }}>
                            {m.gender_preference === "Masculino" ? "Solo hombres" : "Solo mujeres"}
                          </span>
                        )}
                        <span className="ph-pill ph-pill-green" style={{ fontSize: 10 }}>Abierto</span>
                      </div>
                    </div>

                    {/* Fila 2: fecha, hora, formato */}
                    <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
                      📅 {formatMatchDate(m.match_date)} · ⏰ {formatTime(m.match_time)} · {m.format === "doubles" ? "Dobles" : "Individual"}
                    </div>

                    {/* Fila 3: organizador con nivel */}
                    {m.users && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, background: "var(--accent)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>
                          {m.users.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text2)" }}>{m.users.name}</span>
                        {m.users.level && (
                          <span className="ph-pill ph-pill-green" style={{ fontSize: 10, padding: "1px 6px" }}>
                            {NIVEL_LABEL[m.users.level] ?? m.users.level}
                          </span>
                        )}
                        {m.users.mmr && (
                          <span style={{ fontSize: 11, color: "var(--text2)" }}>{m.users.mmr} MMR</span>
                        )}
                      </div>
                    )}

                    {/* Fila 4: slots + estado */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {Array.from({ length: total }).map((_, i) => (
                          <span key={i} style={{
                            fontSize: 10, lineHeight: 1,
                            color: i < filled ? "var(--accent)" : "var(--border)",
                          }}>●</span>
                        ))}
                        <span style={{ fontSize: 11, color: "var(--text2)", marginLeft: 4 }}>
                          {filled}/{total}
                        </span>
                      </div>
                      {isOrganizer
                        ? <span style={{ fontSize: 11, color: "var(--accent)" }}>Tu partido →</span>
                        : <span style={{ fontSize: 11, color: "var(--text2)", background: "var(--bg3)", padding: "4px 10px", borderRadius: 8 }}>Solo por invitación</span>
                      }
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {!loadingM && activeTab === 'mine' && (
          <>
            {myMatches.length === 0 && !errorM ? (
              <div className="ph-card" style={{ textAlign: "center", padding: "24px 16px", marginBottom: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Sin partidos aún</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>Crea o únete a un partido</div>
                <button className="ph-btn" onClick={() => navigate("/crear")} style={{ maxWidth: 180, margin: "0 auto", fontSize: 13 }}>
                  Crear partido
                </button>
              </div>
            ) : (
              myMatches.slice(0, 5).map((m) => {
                const myEntry = (m as Match & { match_players?: { user_id: string; status: string }[] })
                  .match_players?.find((p) => p.user_id === user?.id);
                const isPending = myEntry?.status === 'pending';
                const isResponding = respondingId === m.id;
                return (
                  <div
                    key={m.id} className="ph-card"
                    style={{ marginBottom: 8, padding: "12px 14px", cursor: "pointer" }}
                    onClick={() => navigate(`/matches/${m.id}`)}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isPending ? 10 : 0 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{m.club}</div>
                        <div style={{ fontSize: 12, color: "var(--text2)" }}>
                          {formatMatchDate(m.match_date)} · {formatTime(m.match_time)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {m.is_ranked ? (
                          <span className="ph-pill" style={{ fontSize: 10, background: "rgba(132,204,22,0.1)", color: "var(--accent)", border: "1px solid var(--border2)" }}>
                            🏆
                          </span>
                        ) : (
                          <span className="ph-pill" style={{ fontSize: 10, background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)" }}>
                            🎉
                          </span>
                        )}
                        <span className={`ph-pill ${isPending ? "ph-pill-gray" : STATUS_CLASS[m.status] ?? "ph-pill-gray"}`} style={{ fontSize: 11 }}>
                          {isPending ? "Invitación" : STATUS_LABEL[m.status]}
                        </span>
                      </div>
                    </div>
                    {isPending && (
                      <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleRespond(m.id, true)}
                          disabled={isResponding}
                          style={{
                            flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
                            background: "var(--accent)", color: "#fff",
                            fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                          }}
                        >
                          {isResponding ? "…" : "✓ Aceptar"}
                        </button>
                        <button
                          onClick={() => handleRespond(m.id, false)}
                          disabled={isResponding}
                          style={{
                            flex: 1, padding: "7px 0", borderRadius: 8,
                            border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)",
                            color: "#fca5a5", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                          }}
                        >
                          {isResponding ? "…" : "✕ Rechazar"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

      </div>
      <NavBar />
    </div>
  );
}
