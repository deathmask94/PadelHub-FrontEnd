import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/context/AuthContext";
import NavBar from "~/components/ui/NavBar";

const JUGADORES = [
  { id: 2, ini: "MR", nombre: "Miguel Ríos",   zona: "Viña del Mar", cat: "4°", edad: 31, mmr: 1261, dif: +13, match: 98, color: "#4f46e5" },
  { id: 3, ini: "JV", nombre: "Javier Vega",   zona: "Quilpué",      cat: "3°", edad: 27, mmr: 1219, dif: -29, match: 91, color: "#059669" },
  { id: 4, ini: "AP", nombre: "Ana Paredes",   zona: "Valparaíso",   cat: "4°", edad: 29, mmr: 1195, dif: -53, match: 78, color: "#d97706" },
  { id: 5, ini: "RP", nombre: "Roberto Pino",  zona: "Concón",       cat: "5°", edad: 33, mmr: 1311, dif: +63, match: 72, color: "#db2777" },
  { id: 6, ini: "CM", nombre: "Carla Méndez",  zona: "Valparaíso",   cat: "4°", edad: 26, mmr: 1230, dif: -18, match: 68, color: "#7c3aed" },
];

function MatchRing({ pct, color }: { pct: number; color: string }) {
  const r = 18, c = 2 * Math.PI * r;
  const filled = (pct / 100) * c;
  return (
    <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
      <svg width="48" height="48" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--bg4)" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${filled} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color, lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: 9, color: "var(--text2)", lineHeight: 1 }}>match</span>
      </div>
    </div>
  );
}

export default function Matchmaking() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [selected, setSelected] = useState<typeof JUGADORES[0] | null>(null);
  const [toast,    setToast]    = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleDesafiar = () => {
    if (!selected) return;
    showToast(`Desafío enviado a ${selected.nombre}`);
    setSelected(null);
  };

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
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, textAlign: "center" }}>Matchmaking</div>
            <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "center" }}>MMR ±150 · {user?.zona ?? "tu zona"}</div>
          </div>
          <button style={{
            background: "var(--bg3)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "6px 12px", color: "var(--text2)",
            fontSize: 12, fontFamily: "var(--font-body)", cursor: "pointer",
          }}>
            Filtrar
          </button>
        </div>

        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
            Mejores compatibilidades para ti
          </div>

          {JUGADORES.map((j) => {
            const isSelected = selected?.id === j.id;
            const ringColor  = j.match >= 90 ? "#22c55e" : j.match >= 75 ? "#f59e0b" : "var(--accent)";
            return (
              <div
                key={j.id}
                className="ph-player-card"
                onClick={() => setSelected(isSelected ? null : j)}
                style={{
                  borderColor: isSelected ? "var(--accent)" : undefined,
                  background:  isSelected ? "rgba(79,70,229,0.08)" : undefined,
                }}
              >
                <div className="ph-avatar" style={{ width: 44, height: 44, fontSize: 15, background: j.color }}>
                  {j.ini}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700 }}>{j.nombre}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
                    {j.zona} · {j.cat} · {j.edad} años
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span className="ph-pill ph-pill-purple">{j.mmr} MMR</span>
                    <span className={`ph-pill ${j.dif >= 0 ? "ph-pill-green" : "ph-pill-red"}`}>
                      Dif. {j.dif > 0 ? `+${j.dif}` : j.dif}
                    </span>
                  </div>
                </div>
                <MatchRing pct={j.match} color={ringColor} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Botón desafiar fijo */}
      {selected && (
        <div style={{ padding: "12px 20px 0" }}>
          <button className="ph-btn" onClick={handleDesafiar}>
            Desafiar a {selected.nombre}
          </button>
        </div>
      )}

      <div className={`ph-toast${toast ? " show" : ""}`}>{toast}</div>
      <NavBar />
    </div>
  );
}
