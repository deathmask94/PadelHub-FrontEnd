import { useNavigate, useLocation } from "react-router";

const NAV_ITEMS = [
  { label: "Inicio",   icon: "⌂",  path: "/home" },
  { label: "Match",    icon: "◎",  path: "/matchmaking" },
  { label: "Partido",  icon: "+",  path: "/crear" },
  { label: "Ranking",  icon: "◈",  path: "/ranking" },
  { label: "Perfil",   icon: "○",  path: "/perfil" },
];

export default function NavBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="ph-nav">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "8px 4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: 12,
              transition: "all 0.2s",
            }}
          >
            <span style={{
              fontSize: item.label === "Partido" ? 22 : 18,
              color: active ? "var(--accent)" : "var(--text2)",
              fontWeight: item.label === "Partido" ? 300 : 400,
              lineHeight: 1,
            }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: 10,
              color: active ? "var(--accent)" : "var(--text2)",
              fontWeight: active ? 600 : 400,
              fontFamily: "var(--font-body)",
            }}>
              {item.label}
            </span>
          </button>
        );
      })}

    </nav>
  );
}
