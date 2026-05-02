// ============================================================
// app/routes/home.tsx                            ← RUTA: /home
//
// Pantalla principal tras iniciar sesión.
// Sprint 1: muestra datos del usuario autenticado.
// Sprint 2 preview: acciones rápidas (algunas deshabilitadas).
// ============================================================

import { useNavigate, Link } from "react-router";
import { useAuth } from "~/context/AuthContext";
import NavBar from "~/components/ui/NavBar";

// Datos estáticos de actividad reciente (vendrán de la API en Sprint 2)
const ACTIVIDAD_RECIENTE = [
  { rival: "Pedro Rojas", resultado: "6-3 / 6-4", dias: 3, mmr: +18, ganó: true },
  { rival: "Luis Vera",   resultado: "7-5 / 6-2", dias: 5, mmr: +22, ganó: true },
  { rival: "Andrés Silva",resultado: "3-6 / 4-6", dias: 7, mmr: -14, ganó: false },
];

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Si por alguna razón no hay usuario, redirige al login
  if (!user) {
    navigate("/login");
    return null;
  }

  const initials = user.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout(); // HU-004: limpia token en sessionStorage
    navigate("/login");
  };

  return (
    <div className="ph-screen">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>
            Hola, {user.nombre.split(" ")[0]} 👋
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>
            {user.zona || "Sin zona"} · MMR {user.mmr}
          </div>
        </div>
        {/* Avatar → navega a perfil */}
        <Link to="/perfil" style={{ textDecoration: "none" }}>
          <div className="ph-avatar" style={{ width: 44, height: 44, fontSize: 14, borderRadius: 14, cursor: "pointer", background: "var(--accent)" }}>
            {initials}
          </div>
        </Link>
      </div>

      <div className="ph-scroll">
        {/* ── MMR Snapshot ────────────────────────────────────── */}
        <div className="ph-mmr-bar fade-up" style={{ marginBottom: 16 }}>
          <div>
            <div className="ph-section-label" style={{ marginBottom: 2 }}>Tu MMR</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "var(--accent)", letterSpacing: -1 }}>
              {user.mmr.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>#14 en {user.zona || "tu zona"}</div>
          </div>
          {/* Mini barras decorativas */}
          <div style={{ marginLeft: "auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 52 }}>
              {[28, 20, 34, 26, 38, 36, 44].map((h, i) => (
                <div key={i} style={{
                  flex: 1, height: h,
                  background: i === 6 ? "var(--accent)" : `rgba(79,70,229,${0.35 + i * 0.04})`,
                  borderRadius: "4px 4px 0 0",
                }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: "var(--green)", textAlign: "right", marginTop: 4, fontWeight: 600 }}>▲ +127 este mes</div>
          </div>
        </div>

        {/* ── Próximo partido (Sprint 2 preview) ──────────────── */}
        <div className="ph-section-label fade-up-1">Próximo partido</div>
        <div className="ph-upcoming fade-up-1">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span className="ph-pill ph-pill-purple">Dobles · Confirmado</span>
            <span style={{ fontSize: 12, color: "var(--text2)" }}>Sáb 29 Mar</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Club Pádel Viña del Mar</div>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>10:00 · Cancha 3</div>
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {["FM","MR","AP","JV"].map((ini, i) => (
              <div key={i} className="ph-avatar" style={{
                width: 28, height: 28, fontSize: 10, borderRadius: 8,
                background: ["var(--accent)","#059669","#854d0e","#7c3aed"][i],
              }}>{ini}</div>
            ))}
          </div>
        </div>

        {/* ── Acciones rápidas ─────────────────────────────────── */}
        <div className="ph-section-label fade-up-2" style={{ marginTop: 4 }}>Acciones rápidas</div>
        <div className="ph-quick-grid fade-up-2">
          {/* Sprint 1 ✓ */}
          <Link to="/perfil/editar" className="ph-quick-card">
            <div style={{ fontSize: 24, marginBottom: 8 }}>👤</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Mi perfil</div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>Stats y editar</div>
          </Link>

          {/* Sprint 2 — deshabilitadas visualmente */}
          {[
            { icon: "🏓", title: "Crear partido", sub: "Organiza un juego",   to: "/crear"       },
            { icon: "🎯", title: "Buscar rival",  sub: "Matchmaking MMR",    to: "/matchmaking" },
            { icon: "🏆", title: "Ranking",       sub: "Top Valparaíso",     to: "/ranking"     },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="ph-quick-card">
              <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{item.sub}</div>
            </Link>
          ))}
        </div>

        {/* ── Actividad reciente ────────────────────────────────── */}
        <div className="ph-section-label fade-up-3" style={{ marginTop: 16 }}>Actividad reciente</div>
        <div className="ph-card fade-up-3">
          {ACTIVIDAD_RECIENTE.map((item, i) => (
            <div key={i} className="ph-rank-item" style={{ cursor: "default" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.ganó ? "var(--green)" : "var(--red)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {item.ganó ? "Victoria" : "Derrota"} vs {item.rival}
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>
                  {item.resultado} · Hace {item.dias} días
                </div>
              </div>
              <span className={`ph-pill ${item.ganó ? "ph-pill-green" : "ph-pill-red"}`}>
                {item.mmr > 0 ? "+" : ""}{item.mmr} MMR
              </span>
            </div>
          ))}
        </div>

        {/* ── Cerrar sesión (HU-004) ────────────────────────────── */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "13px", borderRadius: 14, marginTop: 20,
            border: "1px solid var(--red-border)", background: "var(--red-bg)",
            color: "#fca5a5", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "var(--font-body)",
          }}
        >
          🚪 Cerrar sesión
        </button>
      </div>

      <NavBar />
    </div>
  );
}
