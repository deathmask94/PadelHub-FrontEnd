import { useAuth } from "~/context/AuthContext";
import { Navigate, useLocation } from "react-router";
import { isAuthenticated } from "~/services/auth";

interface Props {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
const ADMIN_ROUTES  = ["/admin", "/admin/login"];

export default function ProtectedRoute({ children }: Props) {
  const { isLogged, loading } = useAuth();
  const location = useLocation();

  const isPublic = PUBLIC_ROUTES.includes(location.pathname);
  const isAdmin  = ADMIN_ROUTES.some((r) => location.pathname.startsWith(r));

  // Las rutas /admin/* tienen su propio guard (AdminRoute) — no aplicar auth de jugador
  if (isAdmin) return <>{children}</>;

  if (loading) {
    const hasSession = isAuthenticated();

    if (isPublic && hasSession) return <Navigate to="/home" replace />;
    if (!isPublic && !hasSession) return <Navigate to="/login" replace />;

    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        color: "var(--text2)",
        fontSize: 14,
        fontFamily: "var(--font-body)",
      }}>
        Cargando…
      </div>
    );
  }

  if (isPublic && isLogged) return <Navigate to="/home" replace />;
  if (!isPublic && !isLogged) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
