import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useAuth } from "~/context/AuthContext";
import { apiFetch } from "~/services/auth";
import NavBar from "~/components/ui/NavBar";

const MMR_EVOLUCION = [980, 1020, 1005, 1080, 1120, 1190, 1248];
const SEMANAS       = ["S1","S2","S3","S4","S5","S6","S7"];

const NIVEL_LABEL: Record<string, string> = {
  primera:     "1ra Categoría",
  segunda:     "2da Categoría",
  tercera:     "3ra Categoría",
  cuarta:      "4ta Categoría",
  quinta:      "5ta Categoría",
  sexta:       "6ta Categoría",
  septima_mas: "7ma+ Categoría",
};

// Historial solo para el usuario demo (id=1 = Felipe)
// Un usuario nuevo no tendrá entradas aquí → array vacío → estado vacío
const PARTIDOS_MOCK: Record<number, { rival: string; resultado: string; mmr: number; win: boolean }[]> = {
  1: [
    { rival: "Pedro Rojas",  resultado: "6-3 / 6-4", mmr: +18, win: true  },
    { rival: "Luis Vera",    resultado: "7-5 / 6-2", mmr: +22, win: true  },
    { rival: "Andrés Silva", resultado: "3-6 / 4-6", mmr: -14, win: false },
  ],
};

interface RankingStats { ranking_position: number; total_in_zone: number; mmr_variation_30d: number; }

export default function Perfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [rankingStats, setRankingStats] = useState<RankingStats | null>(null);

  useEffect(() => {
    if (!user?.rut) return;
    apiFetch<{ stats: RankingStats }>(`/api/users/${user.rut}/profile`)
      .then((d) => setRankingStats(d.stats))
      .catch(() => {});
  }, [user?.rut]);

  const initiales = user?.nombre
    ? user.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  // Si el usuario no tiene historial → jugador nuevo
  const partidos     = user?.id ? (PARTIDOS_MOCK[user.id] ?? []) : [];
  const numPartidos  = partidos.length;
  const victorias    = partidos.filter((p) => p.win).length;
  const pctVictorias = numPartidos > 0 ? Math.round((victorias / numPartidos) * 100) : 0;
  const esNuevo      = numPartidos === 0;

  const maxMMR = Math.max(...MMR_EVOLUCION);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="ph-screen">
      <div className="ph-scroll" style={{ padding: "0 0 16px" }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 20px 16px",
        }}>
          <button className="ph-back-btn" onClick={() => navigate("/home", { replace: true })}>←</button>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>Mi perfil</div>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10, padding: "6px 12px",
              color: "#fca5a5", fontSize: 12,
              fontFamily: "var(--font-body)", fontWeight: 600,
              cursor: "pointer", transition: "all .2s",
            }}
          >
            Salir
          </button>
        </div>

        <div style={{ padding: "0 20px" }}>

          {/* ── Cabecera usuario ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div
              className="ph-avatar"
              style={{ width: 64, height: 64, fontSize: 22, background: "var(--accent)", borderRadius: 20, flexShrink: 0, overflow: "hidden" }}
            >
              {user?.photo_url
                ? <img src={user.photo_url} alt={user.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                : initiales
              }
            </div>
            <div>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800,
                textTransform: "uppercase", lineHeight: 1.15, marginBottom: 6,
              }}>
                {user?.nombre ?? "Usuario"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>
                {user?.zona && user?.edad
                  ? `${user.zona} · ${user.edad} años`
                  : user?.zona ?? "—"}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {user?.nivel
                  ? <span className="ph-pill ph-pill-green">{NIVEL_LABEL[user.nivel] ?? user.nivel}</span>
                  : <span className="ph-pill ph-pill-gray">Sin categoría aún</span>
                }
                {!esNuevo && (
                  <span className="ph-pill ph-pill-green">{victorias} victorias</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Datos adicionales ── */}
          <div style={{ textAlign: "right", marginBottom: 14 }}>
            <span
              onClick={() => navigate("/perfil/editar")}
              style={{ fontSize: 13, color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}
            >
              Datos adicionales →
            </span>
          </div>

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
                  : rankingStats
                    ? `#${rankingStats.ranking_position} en ${user?.zona ?? "tu zona"} (de ${rankingStats.total_in_zone})`
                    : `— en ${user?.zona ?? "tu zona"}`}
              </div>
            </div>
            {!esNuevo && rankingStats && (
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: rankingStats.mmr_variation_30d >= 0 ? "#4ade80" : "#fca5a5",
                }}>
                  {rankingStats.mmr_variation_30d >= 0 ? "▲" : "▼"} {rankingStats.mmr_variation_30d >= 0 ? "+" : ""}{rankingStats.mmr_variation_30d}
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>último mes</div>
              </div>
            )}
          </div>

          {/* ── Stats ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { val: esNuevo ? "0" : String(numPartidos), label: "Partidos"  },
              { val: esNuevo ? "—" : `${pctVictorias}%`, label: "Victorias" },
              { val: esNuevo ? "—" : "4.8",              label: "Fair Play" },
            ].map((s) => (
              <div key={s.label} className="ph-card" style={{ textAlign: "center", padding: "14px 8px" }}>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, marginBottom: 4,
                  color: s.val === "—" ? "var(--text2)" : "var(--text)",
                }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── Evolución MMR ── */}
          <div className="ph-card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>
              Evolución MMR — Últimas 7 semanas
            </div>
            {esNuevo ? (
              <div style={{
                height: 80, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <div style={{ fontSize: 24 }}>📈</div>
                <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "center" }}>
                  Tu evolución aparecerá aquí cuando juegues partidos
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                {MMR_EVOLUCION.map((v, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: "100%",
                      height: `${(v / maxMMR) * 100}%`,
                      background: i === MMR_EVOLUCION.length - 1 ? "var(--accent)" : "rgba(132,204,22,0.3)",
                      borderRadius: "4px 4px 0 0",
                    }} />
                    <span style={{ fontSize: 10, color: "var(--text2)" }}>{SEMANAS[i]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Últimos partidos ── */}
          <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
            Últimos partidos
          </div>

          {esNuevo ? (
            <div className="ph-card" style={{ textAlign: "center", padding: "28px 16px", marginBottom: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🎾</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Sin partidos aún</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
                Crea o únete a un partido para empezar a construir tu historial
              </div>
              <button
                className="ph-btn"
                onClick={() => navigate("/crear")}
                style={{ maxWidth: 200, margin: "0 auto" }}
              >
                Crear partido
              </button>
            </div>
          ) : (
            <div className="ph-card" style={{ marginBottom: 8 }}>
              {partidos.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: i < partidos.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: p.win ? "var(--green)" : "var(--red)",
                      display: "inline-block", flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>vs. {p.rival}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>{p.resultado}</div>
                    </div>
                  </div>
                  <span className={`ph-pill ${p.win ? "ph-pill-green" : "ph-pill-red"}`} style={{ fontWeight: 700, fontSize: 12 }}>
                    {p.mmr > 0 ? `+${p.mmr}` : p.mmr}
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
