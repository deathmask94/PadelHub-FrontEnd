import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { useNotifications } from "~/context/NotificationsContext";
import NavBar from "~/components/ui/NavBar";
import Avatar from "~/components/ui/Avatar";
import { getMyMatches, respondInvitation, type Match } from "~/services/matches";

const DIAS  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

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

  const [myMatches,    setMyMatches]    = useState<Match[]>([]);
  const [loadingM,     setLoadingM]     = useState(true);
  const [errorM,       setErrorM]       = useState("");
  const [activeTab,    setActiveTab]    = useState<'invites' | 'mine'>('invites');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { unreadCount } = useNotifications();

  const fetchMatches = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoadingM(true);
    try {
      setMyMatches(await getMyMatches());
    } catch (e: unknown) {
      if (!opts?.silent) setErrorM(e instanceof Error ? e.message : 'Error al cargar los partidos');
    } finally {
      if (!opts?.silent) setLoadingM(false);
    }
  }, []);

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
            <div style={{ display: "flex", gap: 6 }}>
              <span className="ph-pill" style={{
                fontSize: 10,
                background: proximoPartido.is_ranked ? "rgba(132,204,22,0.1)" : "var(--bg3)",
                color: proximoPartido.is_ranked ? "var(--accent)" : "var(--text2)",
                border: `1px solid ${proximoPartido.is_ranked ? "var(--border2)" : "var(--border)"}`,
              }}>
                {proximoPartido.is_ranked ? "🏆 Competitivo" : "🎉 Casual"}
              </span>
              <span className="ph-pill" style={{ fontSize: 10, background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border)" }}>
                {proximoPartido.gender_preference === "Masculino" ? "Solo hombres" : proximoPartido.gender_preference === "Femenino" ? "Solo mujeres" : "Mixto"}
              </span>
            </div>
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
          {(['invites', 'mine'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
              fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: activeTab === tab ? "var(--accent)" : "var(--bg3)",
              color:      activeTab === tab ? "#fff"          : "var(--text2)",
              transition: "all .2s",
            }}>
              {tab === 'invites' ? 'Invitaciones' : 'Mis partidos'}
            </button>
          ))}
        </div>

        {errorM && <div className="ph-error">{errorM}</div>}

        {loadingM && (
          <div className="ph-card" style={{ textAlign: "center", padding: "20px", color: "var(--text2)", fontSize: 13, marginBottom: 8 }}>
            Cargando…
          </div>
        )}

        {/* ── Invitaciones: solo lo que otros te enviaron a ti ── */}
        {!loadingM && activeTab === 'invites' && (
          <>
            {pendingInvites.length === 0 && !errorM ? (
              <div className="ph-card" style={{ textAlign: "center", padding: "24px 16px", marginBottom: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎾</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Sin partidos disponibles</div>
              </div>
            ) : (
              pendingInvites.map((m) => {
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
