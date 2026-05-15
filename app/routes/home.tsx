import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import { usePartidos } from "~/context/PartidosContext";
import NavBar from "~/components/ui/NavBar";

// Actividad reciente: solo para el usuario demo (id=1)
const ACTIVIDAD_DEMO: Record<number, { rival: string; resultado: string; hace: string; mmr: number; win: boolean }[]> = {
  1: [
    { rival: "Pedro Rojas",  resultado: "6-3 / 6-4", hace: "Hace 3 días", mmr: +18, win: true  },
    { rival: "Luis Vera",    resultado: "7-5 / 6-2", hace: "Hace 5 días", mmr: +22, win: true  },
    { rival: "Andrés Silva", resultado: "3-6 / 4-6", hace: "Hace 7 días", mmr: -14, win: false },
  ],
};

export default function Home() {
  const { user, logout } = useAuth();
  const { partidos }     = usePartidos();
  const navigate         = useNavigate();

  const initiales = user?.nombre
    ? user.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  // Próximo partido: el primero del array (el más reciente creado)
  const proximoPartido = partidos[0] ?? null;

  // Actividad reciente: solo usuario demo, usuario nuevo ve estado vacío
  const actividad = user?.id ? (ACTIVIDAD_DEMO[user.id] ?? []) : [];
  const esNuevo   = actividad.length === 0;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

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
          <button
            onClick={() => navigate("/perfil")}
            style={{
              width: 44, height: 44, background: "var(--accent)", borderRadius: 14,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "#fff",
            }}
          >
            {initiales}
          </button>
        </div>

        {/* ── MMR card ── */}
        <div className="ph-mmr-bar" style={{ marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
              Tu MMR
            </div>
            <div className="ph-mmr-num">{user?.mmr ?? 1000}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
              {esNuevo
                ? "Juega partidos para obtener ranking"
                : `#14 en ${user?.zona ?? "tu zona"}`}
            </div>
          </div>
          <div className="ph-bars-chart">
            {[30, 45, 35, 55, 48, 65, 80].map((h, i) => (
              <div
                key={i}
                className="ph-bar"
                style={{
                  height: `${h}%`,
                  background: i === 6 ? "var(--accent)" : "rgba(79,70,229,0.3)",
                }}
              />
            ))}
          </div>
          {!esNuevo && (
            <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 600, alignSelf: "flex-end" }}>
              ▲ +127 este mes
            </div>
          )}
        </div>

        {/* ── Próximo partido ── */}
        <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
          Próximo partido
        </div>

        {proximoPartido ? (
          <div
            className="ph-upcoming-card"
            onClick={() => navigate("/crear")}
            style={{ marginBottom: 20 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span className="ph-pill ph-pill-purple">
                  {proximoPartido.formato === "dobles" ? "Dobles" : "Individual"}
                </span>
                <span className="ph-pill ph-pill-green">{proximoPartido.estado}</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>{proximoPartido.fechaStr}</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
              {proximoPartido.club}
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
              {proximoPartido.hora}{proximoPartido.cancha ? ` · ${proximoPartido.cancha}` : ""}
            </div>
            {proximoPartido.jugadores.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {proximoPartido.jugadores.map((j, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {proximoPartido.formato === "dobles" && i === 2 && (
                      <span style={{ fontSize: 11, color: "var(--text2)", margin: "0 2px" }}>vs</span>
                    )}
                    <div
                      className="ph-avatar"
                      style={{ width: 32, height: 32, fontSize: 12, background: j.color }}
                    >
                      {j.ini}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Estado vacío: sin partido registrado */
          <div
            className="ph-card"
            style={{
              marginBottom: 20, textAlign: "center", padding: "20px 16px",
              border: "1px dashed var(--border)", cursor: "pointer",
            }}
            onClick={() => navigate("/crear")}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎾</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Sin partido próximo</div>
            <div style={{ fontSize: 12, color: "var(--accent)" }}>+ Crear uno ahora</div>
          </div>
        )}

        {/* ── Acciones rápidas ── */}
        <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
          Acciones rápidas
        </div>
        <div className="ph-quick-grid" style={{ marginBottom: 20 }}>
          {[
            { icon: "🏓", title: "Crear partido", sub: "Organiza un juego",    path: "/crear"       },
            { icon: "🎯", title: "Buscar rival",  sub: "Matchmaking MMR",      path: "/matchmaking" },
            { icon: "🏆", title: "Ranking",       sub: `Top ${user?.zona ?? "tu zona"}`, path: "/ranking" },
            { icon: "📊", title: "Mi perfil",     sub: "Stats y historial",    path: "/perfil"      },
          ].map((a) => (
            <div key={a.title} className="ph-quick-card" onClick={() => navigate(a.path)}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>{a.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Actividad reciente ── */}
        <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
          Actividad reciente
        </div>

        {esNuevo ? (
          <div className="ph-card" style={{ textAlign: "center", padding: "24px 16px", marginBottom: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Sin actividad aún</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>
              Tus partidos jugados aparecerán aquí
            </div>
          </div>
        ) : (
          <div className="ph-card" style={{ marginBottom: 24 }}>
            {actividad.map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: i < actividad.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: a.win ? "var(--green)" : "var(--red)",
                    display: "inline-block", flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {a.win ? "Victoria" : "Derrota"} vs {a.rival}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>{a.resultado} · {a.hace}</div>
                  </div>
                </div>
                <span className={`ph-pill ${a.win ? "ph-pill-green" : "ph-pill-red"}`} style={{ fontSize: 12, fontWeight: 700 }}>
                  {a.mmr > 0 ? `+${a.mmr}` : a.mmr} MMR
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Cerrar sesión discreto */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span
            onClick={handleLogout}
            style={{ fontSize: 12, color: "var(--text2)", cursor: "pointer", textDecoration: "underline" }}
          >
            Cerrar sesión
          </span>
        </div>

      </div>
      <NavBar />
    </div>
  );
}
