// ============================================================
// app/components/ui/NavBar.tsx
//
// Barra de navegación inferior — compartida entre Home,
// Perfil, Ranking, Matchmaking y Crear Partido.
// Usa NavLink de React Router para resaltar la ruta activa.
// ============================================================

import { NavLink } from "react-router";

const NAV_ITEMS = [
  { to: "/home",        icon: "⌂",  label: "Inicio"  },
  { to: "/matchmaking", icon: "◎",  label: "Match"   },
  { to: "/crear",       icon: "＋", label: "Partido" },
  { to: "/ranking",     icon: "◈",  label: "Ranking" },
  { to: "/perfil",      icon: "◉",  label: "Perfil"  },
];

export default function NavBar() {
  return (
    <nav className="ph-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `ph-nav-item${isActive ? " active" : ""}`}
        >
          {/* Ícono: color cambia con CSS .active */}
          <span className="ph-nav-icon" style={{ filter: "none" }}>
            {item.icon}
          </span>
          <span className="ph-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
