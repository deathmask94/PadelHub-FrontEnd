// ============================================================
// app/routes/perfil.tsx                        ← RUTA: /perfil
//
// Perfil del jugador — vista de solo lectura.
// Muestra MMR, stats y historial.
// El botón "Editar" navega a /perfil/editar (HU-003).
// ============================================================

import { Link } from "react-router";
import { useAuth } from "~/context/AuthContext";
import NavBar from "~/components/ui/NavBar";

const HISTORIAL = [
  { rival: "Pedro Rojas", resultado: "6-3 / 6-4", mmr: +18, ganó: true },
  { rival: "Luis Vera",   resultado: "7-5 / 6-2", mmr: +22, ganó: true },
  { rival: "Andrés Silva",resultado: "3-6 / 4-6", mmr: -14, ganó: false },
];

export default function PerfilPage() {
  const { user } = useAuth();
  if (!user) return null;

  const initials = user.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="ph-screen">
      <div className="ph-top-bar">
        <Link to="/home" className="ph-back-btn">←</Link>
        <span className="ph-title">Mi perfil</span>
        {/* Botón editar (HU-003) */}
        <Link to="/perfil/editar" style={{
          marginLeft: "auto", background: "rgba(79,70,229,0.15)",
          border: "1px solid rgba(79,70,229,0.3)", borderRadius: 8,
          padding: "4px 12px", fontSize: 12, color: "#a5b4fc",
          fontWeight: 600, textDecoration: "none",
        }}>
          Editar
        </Link>
      </div>

      <div className="ph-scroll">
        {/* ── Header perfil ───────────────────────────────────── */}
        <div className="fade-up" style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 16 }}>
          <div className="ph-avatar" style={{ width: 72, height: 72, fontSize: 24, border: "2px solid rgba(79,70,229,0.5)" }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>{user.nombre}</div>
            <div style={{ fontSize: 13, color: "var(--text2)", margin: "2px 0 8px" }}>
              {user.zona || "Sin zona"}{user.edad ? ` · ${user.edad} años` : ""}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {user.nivel && <span className="ph-pill ph-pill-purple">{user.nivel}{user.categoria ? ` · ${user.categoria}` : ""}</span>}
              <span className="ph-pill ph-pill-green">38 victorias</span>
            </div>
          </div>
        </div>

        {/* ── MMR ─────────────────────────────────────────────── */}
        <div className="ph-mmr-bar fade-up-1" style={{ marginBottom: 16 }}>
          <div>
            <div className="ph-section-label" style={{ marginBottom: 2 }}>MMR</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "var(--accent)", letterSpacing: -1 }}>
              {user.mmr.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>#14 en {user.zona || "tu zona"}</div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--green)" }}>▲ +127</div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>último mes</div>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────── */}
        <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { val: "54",  label: "Partidos" },
            { val: "70%", label: "Victorias" },
            { val: "4.8", label: "Fair play" },
          ].map((s) => (
            <div key={s.label} className="ph-card" style={{ textAlign: "center", padding: 12 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Evolución MMR ────────────────────────────────────── */}
        <div className="ph-card fade-up-3" style={{ marginBottom: 16 }}>
          <div className="ph-section-label" style={{ marginBottom: 12 }}>Evolución MMR — últimas 7 semanas</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 64 }}>
            {[36,28,44,32,50,46,60].map((h, i) => (
              <div key={i} style={{
                flex: 1, height: h, borderRadius: "4px 4px 0 0",
                background: i === 6 ? "var(--accent)" : `rgba(79,70,229,${0.35 + i * 0.04})`,
              }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {["S1","S2","S3","S4","S5","S6","S7"].map((s, i) => (
              <span key={s} style={{ fontSize: 9, color: i === 6 ? "var(--accent)" : "var(--text2)", fontWeight: i === 6 ? 600 : 400 }}>{s}</span>
            ))}
          </div>
        </div>

        {/* ── Historial ───────────────────────────────────────── */}
        <div className="ph-section-label fade-up-4">Últimos partidos</div>
        <div className="ph-card fade-up-4">
          {HISTORIAL.map((h, i) => (
            <div key={i} className="ph-rank-item" style={{ cursor: "default" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.ganó ? "var(--green)" : "var(--red)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>vs. {h.rival}</div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>{h.resultado}</div>
              </div>
              <span className={`ph-pill ${h.ganó ? "ph-pill-green" : "ph-pill-red"}`}>
                {h.mmr > 0 ? "+" : ""}{h.mmr}
              </span>
            </div>
          ))}
        </div>
      </div>

      <NavBar />
    </div>
  );
}
