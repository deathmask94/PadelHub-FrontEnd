import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import NavBar from "~/components/ui/NavBar";

const ZONAS = ["Valparaíso", "Viña del Mar", "Quilpué", "Concón", "Santiago"];

const RANKING_DATA = [
  { pos: 1,  ini: "LP", nombre: "Luis P.",         zona: "Valparaíso", cat: "5°", mmr: 1445, delta: +31,  color: "#d97706" },
  { pos: 2,  ini: "RS", nombre: "Roberto S.",      zona: "Valparaíso", cat: "5°", mmr: 1389, delta: +12,  color: "#7c3aed" },
  { pos: 3,  ini: "DM", nombre: "Diego M.",        zona: "Valparaíso", cat: "4°", mmr: 1356, delta: -5,   color: "#b45309" },
  { pos: 4,  ini: "PR", nombre: "Pedro Rojas",     zona: "Valparaíso", cat: "5°", mmr: 1312, delta: +31,  color: "#0891b2" },
  { pos: 5,  ini: "AP", nombre: "Ana Paredes",     zona: "Valparaíso", cat: "4°", mmr: 1295, delta: -12,  color: "#d97706" },
  { pos: 6,  ini: "MR", nombre: "Miguel Ríos",     zona: "Viña del Mar",cat:"4°", mmr: 1261, delta: +44,  color: "#059669" },
  { pos: 7,  ini: "CM", nombre: "Carla Méndez",    zona: "Valparaíso", cat: "4°", mmr: 1250, delta: +19,  color: "#7c3aed" },
  { pos: 14, ini: "FM", nombre: "Felipe Martínez", zona: "Valparaíso", cat: "4°", mmr: 1248, delta: +127, color: "#4f46e5", isMe: true },
  { pos: 15, ini: "JV", nombre: "Javier Vega",     zona: "Quilpué",    cat: "3°", mmr: 1219, delta: -8,   color: "#4f46e5" },
  { pos: 16, ini: "LV", nombre: "Luis Vera",       zona: "Viña del Mar",cat:"3°", mmr: 1201, delta: 0,    color: "#0891b2" },
];

export default function Ranking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [zona,      setZona]      = useState(user?.zona ?? "Valparaíso");
  const [showZonas, setShowZonas] = useState(false);

  const podio = RANKING_DATA.slice(0, 3);
  const lista = RANKING_DATA.slice(3);

  const MEDAL = ["🥇", "🥈", "🥉"];

  return (
    <div className="ph-screen">
      <div className="ph-scroll" style={{ padding: "0 0 16px" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 20px 16px",
        }}>
          <button className="ph-back-btn" onClick={() => navigate(-1)}>←</button>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, textAlign: "center" }}>Ranking</div>
            <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "center" }}>{zona} · Temporada 2026</div>
          </div>
          {/* Filtro zona */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowZonas(!showZonas)}
              style={{
                background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "6px 12px", color: "var(--text)",
                fontSize: 12, fontFamily: "var(--font-body)", cursor: "pointer",
              }}
            >
              {zona} ▾
            </button>
            {showZonas && (
              <div style={{
                position: "absolute", top: "110%", right: 0, zIndex: 10,
                background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: 12, minWidth: 140, overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}>
                {ZONAS.map((z) => (
                  <button
                    key={z}
                    onClick={() => { setZona(z); setShowZonas(false); }}
                    style={{
                      width: "100%", padding: "10px 14px", background: z === zona ? "rgba(79,70,229,0.1)" : "transparent",
                      border: "none", borderBottom: "1px solid var(--border)",
                      color: z === zona ? "var(--accent)" : "var(--text)",
                      fontFamily: "var(--font-body)", fontSize: 13, textAlign: "left", cursor: "pointer",
                    }}
                  >
                    {z}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "0 20px" }}>

          {/* ── Podio ── */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr",
            gap: 8, marginBottom: 20, alignItems: "flex-end",
          }}>
            {[podio[1], podio[0], podio[2]].map((p, i) => {
              const realPos = i === 0 ? 2 : i === 1 ? 1 : 3;
              const sizes   = [56, 68, 56];
              const fontSize= [16, 20, 16];
              return (
                <div key={p.ini} style={{ textAlign: "center" }}>
                  <div
                    className="ph-avatar"
                    style={{
                      width: sizes[i], height: sizes[i], fontSize: fontSize[i],
                      background: p.color, margin: "0 auto 6px", borderRadius: 18,
                    }}
                  >
                    {p.ini}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{p.nombre.split(" ")[0]} {p.nombre.split(" ")[1]?.[0]}.</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: realPos === 1 ? "#f59e0b" : "var(--text)" }}>
                    {p.mmr.toLocaleString()}
                  </div>
                  <div style={{
                    background: realPos === 1 ? "rgba(245,158,11,0.15)" : "var(--bg3)",
                    border: `1px solid ${realPos === 1 ? "rgba(245,158,11,0.4)" : "var(--border)"}`,
                    borderRadius: 10, padding: "6px 0", marginTop: 6, fontSize: 18,
                  }}>
                    {MEDAL[realPos - 1]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Lista ── */}
          <div className="ph-card">
            {lista.map((j, i) => (
              <div
                key={j.pos}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 0",
                  borderBottom: i < lista.length - 1 ? "1px solid var(--border)" : "none",
                  background: (j as any).isMe ? "rgba(79,70,229,0.05)" : "transparent",
                  borderRadius: (j as any).isMe ? 8 : 0,
                }}
              >
                <span style={{ width: 22, fontSize: 13, color: "var(--text2)", fontWeight: 600, textAlign: "center" }}>
                  {j.pos}
                </span>
                <div className="ph-avatar" style={{ width: 36, height: 36, fontSize: 13, background: j.color }}>
                  {j.ini}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: (j as any).isMe ? 700 : 500, color: (j as any).isMe ? "var(--accent)" : "var(--text)" }}>
                    {j.nombre}{(j as any).isMe ? " · Tú" : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{j.zona} · {j.cat}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800 }}>
                    {j.mmr.toLocaleString()}
                  </div>
                  {j.delta !== 0 && (
                    <div style={{ fontSize: 11, color: j.delta > 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                      {j.delta > 0 ? `▲ +${j.delta}` : `▼ ${j.delta}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <NavBar />
    </div>
  );
}
