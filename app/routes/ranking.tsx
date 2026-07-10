import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import NavBar from "~/components/ui/NavBar";
import { getRanking, type RankingEntry } from "~/services/matches";

const ZONAS = ["Valparaíso","Viña del Mar","Quilpué","Villa Alemana","Concón"];
const MEDAL = ["🥇", "🥈", "🥉"];

const AVATAR_COLORS = [
  "#4f46e5","#059669","#d97706","#7c3aed","#db2777",
  "#0891b2","#b45309","#dc2626","#16a34a","#9333ea",
];

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function avatarColor(id: string) {
  const hash = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function Ranking() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [zona,       setZona]       = useState(user?.zona ?? "Valparaíso");
  const [showZonas,  setShowZonas]  = useState(false);
  const [data,       setData]       = useState<RankingEntry[]>([]);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  useEffect(() => { setPage(1); }, [zona]);

  useEffect(() => {
    setLoading(true);
    setError("");
    getRanking(zona, page)
      .then((res) => { setData(res.players ?? []); setTotalPages(res.totalPages ?? 1); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [zona, page]);

  // El podio (top 3) solo tiene sentido en la primera página y cuando hay
  // al menos 3 jugadores; si no, se muestran todos en la lista plana. Sin
  // este chequeo, una zona con 1 o 2 jugadores no mostraba a nadie: no
  // alcanzaban para el podio (mínimo 3) y slice(3) los dejaba fuera de la
  // lista tambien.
  const showPodio = page === 1 && data.length >= 3;
  const podio = showPodio ? data.slice(0, 3) : [];
  const lista = showPodio ? data.slice(3) : data;

  return (
    <div className="ph-screen">
      <div className="ph-scroll" style={{ padding: "0 0 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px" }}>
          <button className="ph-back-btn" onClick={() => navigate(-1)}>←</button>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, textAlign: "center" }}>Ranking</div>
            <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "center" }}>{zona} · Temporada 2026</div>
          </div>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowZonas(!showZonas)}
              style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10, padding: "6px 12px", color: "var(--text)", fontSize: 12, fontFamily: "var(--font-body)", cursor: "pointer" }}
            >
              {zona} ▾
            </button>
            {showZonas && (
              <div style={{ position: "absolute", top: "110%", right: 0, zIndex: 10, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, minWidth: 140, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                {ZONAS.map((z) => (
                  <button key={z} onClick={() => { setZona(z); setShowZonas(false); }}
                    style={{ width: "100%", padding: "10px 14px", background: z === zona ? "rgba(132,204,22,0.1)" : "transparent", border: "none", borderBottom: "1px solid var(--border)", color: z === zona ? "var(--accent)" : "var(--text)", fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", cursor: "pointer" }}>
                    {z}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "0 20px" }}>

          {loading && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text2)", fontSize: 14 }}>
              Cargando ranking…
            </div>
          )}

          {error && <div className="ph-error">{error}</div>}

          {!loading && data.length === 0 && !error && (
            <div className="ph-card" style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🏆</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Sin jugadores en esta zona</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>Sé el primero en registrarte en {zona}</div>
            </div>
          )}

          {/* Podio */}
          {!loading && podio.length >= 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", gap: 8, marginBottom: 20, alignItems: "flex-end" }}>
              {[podio[1], podio[0], podio[2]].map((p, i) => {
                const realPos = i === 0 ? 2 : i === 1 ? 1 : 3;
                const sizes   = [56, 68, 56];
                const fsizes  = [16, 20, 16];
                const isMe    = p.id === user?.id;
                return (
                  <div key={p.id} style={{ textAlign: "center" }}>
                    <div className="ph-avatar" style={{ width: sizes[i], height: sizes[i], fontSize: fsizes[i], background: isMe ? "var(--accent)" : avatarColor(p.id), margin: "0 auto 6px", borderRadius: 18 }}>
                      {initials(p.name)}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                      {p.name.split(" ")[0]} {p.name.split(" ")[1]?.[0]}.{isMe ? " 👤" : ""}
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: realPos === 1 ? "#f59e0b" : "var(--text)" }}>
                      {p.mmr.toLocaleString()}
                    </div>
                    <div style={{ background: realPos === 1 ? "rgba(245,158,11,0.15)" : "var(--bg3)", border: `1px solid ${realPos === 1 ? "rgba(245,158,11,0.4)" : "var(--border)"}`, borderRadius: 10, padding: "6px 0", marginTop: 6, fontSize: 18 }}>
                      {MEDAL[realPos - 1]}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Lista */}
          {!loading && lista.length > 0 && (
            <div className="ph-card">
              {lista.map((j, i) => {
                const isMe = j.id === user?.id;
                return (
                  <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < lista.length - 1 ? "1px solid var(--border)" : "none", background: isMe ? "rgba(132,204,22,0.07)" : "transparent", borderRadius: isMe ? 8 : 0 }}>
                    <span style={{ width: 22, fontSize: 13, color: "var(--text2)", fontWeight: 600, textAlign: "center" }}>
                      {j.position}
                    </span>
                    <div className="ph-avatar" style={{ width: 36, height: 36, fontSize: 13, background: isMe ? "var(--accent)" : avatarColor(j.id) }}>
                      {initials(j.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: isMe ? 700 : 500, color: isMe ? "var(--accent)" : "var(--text)" }}>
                        {j.name}{isMe ? " · Tú" : ""}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>{j.zone} · {j.level}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>
                        {j.mmr.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {!loading && data.length > 0 && totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10,
                  padding: "8px 16px", fontSize: 13, color: page === 1 ? "var(--text2)" : "var(--text)",
                  cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.5 : 1,
                  fontFamily: "var(--font-body)",
                }}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: 13, color: "var(--text2)" }}>Página {page} de {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10,
                  padding: "8px 16px", fontSize: 13, color: page === totalPages ? "var(--text2)" : "var(--text)",
                  cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.5 : 1,
                  fontFamily: "var(--font-body)",
                }}
              >
                Siguiente →
              </button>
            </div>
          )}

        </div>
      </div>
      <NavBar />
    </div>
  );
}
