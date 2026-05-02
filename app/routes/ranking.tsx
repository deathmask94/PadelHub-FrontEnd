// ============================================================
// app/routes/ranking.tsx                      ← RUTA: /ranking
//
// Leaderboard regional — Sprint 2 (HU-012, HU-013).
// Por ahora usa datos estáticos (mock visual).
// ============================================================

import { Link } from "react-router";
import { useAuth } from "~/context/AuthContext";
import NavBar from "~/components/ui/NavBar";

const PODIO = [
  { ini: "RS", nombre: "Roberto S.", mmr: 1389, color: "#7c3aed", trend: "+21" },
  { ini: "LP", nombre: "Luis P.",    mmr: 1445, color: "#b45309", trend: "+18" },
  { ini: "DM", nombre: "Diego M.",   mmr: 1356, color: "#854d0e", trend: "-5"  },
];

const LISTA = [
  { pos:4,  ini:"PR", nombre:"Pedro Rojas",    zona:"Valparaíso",   mmr:1312, cat:"5ª", trend:"+31", up:true  },
  { pos:5,  ini:"AP", nombre:"Ana Paredes",    zona:"Valparaíso",   mmr:1295, cat:"4ª", trend:"-12", up:false },
  { pos:6,  ini:"MR", nombre:"Miguel Ríos",    zona:"Viña del Mar", mmr:1261, cat:"4ª", trend:"+44", up:true  },
  { pos:7,  ini:"CM", nombre:"Carla Méndez",   zona:"Valparaíso",   mmr:1250, cat:"4ª", trend:"+19", up:true  },
  { pos:14, ini:"FM", nombre:"Felipe Martínez",zona:"Valparaíso",   mmr:1248, cat:"4ª", trend:"+127",up:true, isMe:true },
  { pos:15, ini:"JV", nombre:"Javier Vega",    zona:"Quilpué",      mmr:1219, cat:"3ª", trend:"-8",  up:false },
  { pos:16, ini:"LV", nombre:"Luis Vera",      zona:"Viña del Mar", mmr:1201, cat:"3ª", trend:"0",   up:null  },
];

const BG = ["#7c3aed","#b45309","#854d0e"];

export default function RankingPage() {
  const { user } = useAuth();

  return (
    <div className="ph-screen">
      <div className="ph-top-bar">
        <Link to="/home" className="ph-back-btn">←</Link>
        <div>
          <div className="ph-title">Ranking</div>
          <div style={{ fontSize: 11, color: "var(--text2)" }}>Valparaíso · Temporada 2026</div>
        </div>
        <div style={{
          marginLeft: "auto", background: "rgba(79,70,229,0.15)",
          border: "1px solid rgba(79,70,229,0.3)", borderRadius: 8,
          padding: "4px 10px", fontSize: 11, color: "#a5b4fc", fontWeight: 600,
        }}>Zona ▾</div>
      </div>

      <div className="ph-scroll">
        {/* ── Podio top 3 ─────────────────────────────────────── */}
        <div className="fade-up" style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, marginBottom: 20, paddingTop: 8 }}>
          {[PODIO[1], PODIO[0], PODIO[2]].map((p, idx) => {
            const heights  = [72, 54, 40];
            const sizes    = [60, 52, 52];
            const fontSzs  = [18, 16, 16];
            const medals   = ["🥇","🥈","🥉"];
            const mmrColor = ["var(--gold)","#a5b4fc","#fcd34d"];
            return (
              <div key={p.ini} style={{ textAlign: "center", flex: 1 }}>
                <div className="ph-avatar" style={{ width: sizes[idx], height: sizes[idx], fontSize: fontSzs[idx], margin: "0 auto 6px", border: `2px solid ${BG[idx]}55`, background: BG[idx] }}>
                  {p.ini}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{p.nombre}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: idx === 0 ? 16 : 14, fontWeight: 700, color: mmrColor[idx] }}>
                  {p.mmr.toLocaleString()}
                </div>
                <div style={{ background: idx === 0 ? "rgba(245,158,11,0.1)" : "var(--bg4)", borderRadius: "8px 8px 0 0", height: heights[idx], marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", border: idx === 0 ? "1px solid rgba(245,158,11,0.2)" : "none" }}>
                  <span style={{ fontSize: idx === 0 ? 24 : 18 }}>{medals[idx]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Lista ───────────────────────────────────────────── */}
        <div className="ph-card fade-up-1">
          {LISTA.map((item) => (
            <div key={item.pos} className="ph-rank-item" style={item.isMe ? {
              background: "rgba(79,70,229,0.07)", borderRadius: 10,
              padding: "12px 8px", margin: "-1px -4px",
              border: "1px solid rgba(79,70,229,0.2)",
            } : {}}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, width: 28, textAlign: "center", color: item.isMe ? "var(--accent)" : "var(--text2)" }}>
                {item.pos}
              </div>
              <div className="ph-avatar" style={{ width: 36, height: 36, fontSize: 12, borderRadius: 10, border: item.isMe ? "2px solid rgba(79,70,229,0.5)" : "none" }}>
                {item.ini}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: item.isMe ? 600 : 500, color: item.isMe ? "var(--accent)" : "var(--text)" }}>
                  {item.nombre}{item.isMe ? " · Tú" : ""}
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>{item.zona} · {item.cat}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                  {item.mmr.toLocaleString()}
                </div>
                <span className={`ph-pill ${item.up === true ? "ph-pill-green" : item.up === false ? "ph-pill-red" : "ph-pill-gray"}`} style={{ fontSize: 9 }}>
                  {item.up === true ? "▲" : item.up === false ? "▼" : "="} {item.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NavBar />
    </div>
  );
}
