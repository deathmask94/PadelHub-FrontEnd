// ============================================================
// app/routes/matchmaking.tsx              ← RUTA: /matchmaking
// Sprint 2 preview — HU-007, HU-008
// ============================================================

import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "~/context/AuthContext";
import NavBar from "~/components/ui/NavBar";

const RIVALES = [
  { ini:"MR", nombre:"Miguel Ríos",   zona:"Viña del Mar",mmr:1261,cat:"4ª",edad:31,match:98,dif:+13,ring:"high",color:"var(--accent)" },
  { ini:"JV", nombre:"Javier Vega",   zona:"Quilpué",     mmr:1219,cat:"3ª",edad:27,match:91,dif:-29,ring:"high",color:"#059669" },
  { ini:"AP", nombre:"Ana Paredes",   zona:"Valparaíso",  mmr:1195,cat:"4ª",edad:29,match:78,dif:-53,ring:"mid", color:"#854d0e" },
  { ini:"RP", nombre:"Roberto Pino",  zona:"Concón",      mmr:1311,cat:"5ª",edad:33,match:72,dif:+63,ring:"mid", color:"#7c3aed" },
  { ini:"CM", nombre:"Carla Méndez",  zona:"Valparaíso",  mmr:1230,cat:"4ª",edad:26,match:68,dif:-18,ring:"mid", color:"#db2777" },
];

export default function MatchmakingPage() {
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  return (
    <div className="ph-screen">
      <div className="ph-top-bar">
        <Link to="/home" className="ph-back-btn">←</Link>
        <div>
          <div className="ph-title">Matchmaking</div>
          <div style={{ fontSize: 11, color: "var(--text2)" }}>MMR ±150 · Valparaíso</div>
        </div>
        <div style={{
          marginLeft: "auto", background: "rgba(79,70,229,0.15)",
          border: "1px solid rgba(79,70,229,0.3)", borderRadius: 8,
          padding: "4px 10px", fontSize: 11, color: "#a5b4fc", fontWeight: 600, cursor: "pointer",
        }}>Filtrar</div>
      </div>

      <div className="ph-scroll">
        <div className="ph-section-label fade-up">Mejores compatibilidades para ti</div>

        {RIVALES.map((r, i) => (
          <div
            key={r.ini}
            className={`ph-card fade-up-${i} ${i === 0 ? "highlighted" : ""}`}
            style={{
              marginBottom: 8, display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", transition: "all .2s",
              border: i === 0 ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: i === 0 ? "rgba(79,70,229,0.08)" : "var(--bg3)",
            }}
            onClick={() => showToast(`¡Desafío enviado a ${r.nombre} por WhatsApp!`)}
          >
            <div className="ph-avatar" style={{ width: 46, height: 46, fontSize: 15, background: r.color }}>
              {r.ini}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{r.nombre}</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>{r.zona} · {r.cat} · {r.edad} años</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <span className={`ph-pill ${r.ring === "high" ? "ph-pill-purple" : "ph-pill-amber"}`} style={{ fontSize: 10 }}>
                  {r.mmr} MMR
                </span>
                <span style={{ fontSize: 10, color: "var(--text2)" }}>Dif. {r.dif > 0 ? "+" : ""}{r.dif}</span>
              </div>
            </div>
            {/* Ring de match % */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center",
                background: r.ring === "high"
                  ? `conic-gradient(#22c55e 0% ${r.match}%, var(--bg4) ${r.match}%)`
                  : `conic-gradient(#f59e0b 0% ${r.match}%, var(--bg4) ${r.match}%)`,
              }}>
                <div style={{
                  width: 34, height: 34, background: "var(--bg3)", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: r.ring === "high" ? "#86efac" : "#fcd34d",
                }}>
                  {r.match}%
                </div>
              </div>
              <div style={{ fontSize: 9, color: "var(--text2)", marginTop: 4 }}>match</div>
            </div>
          </div>
        ))}

        <button
          className="ph-btn"
          style={{ marginTop: 8 }}
          onClick={() => showToast("¡Desafío enviado a Miguel Ríos por WhatsApp!")}
        >
          Desafiar a Miguel Ríos
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "var(--green)", color: "#fff", padding: "12px 20px",
          borderRadius: 12, fontSize: 14, fontWeight: 500, zIndex: 1000,
          whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          {toast}
        </div>
      )}

      <NavBar />
    </div>
  );
}
