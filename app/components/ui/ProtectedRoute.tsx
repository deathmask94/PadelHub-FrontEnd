import { useAuth } from "~/context/AuthContext";
import { Navigate, useLocation } from "react-router";
import { isAuthenticated } from "~/services/auth.mock";

interface Props {
  children: React.ReactNode;
}

// Rutas públicas que NO requieren sesión
const PUBLIC_ROUTES = ["/login", "/register"];

export default function ProtectedRoute({ children }: Props) {
  const { isLogged, loading } = useAuth();
  const location = useLocation();

  const isPublic = PUBLIC_ROUTES.includes(location.pathname);

  // Durante la hidratación inicial
  if (loading) {
    const hasSession = isAuthenticated();

    // Ruta pública con sesión activa → redirige al home
    if (isPublic && hasSession) {
      return <Navigate to="/home" replace />;
    }

    // Ruta protegida sin sesión → redirige al login
    if (!isPublic && !hasSession) {
      return <Navigate to="/login" replace />;
    }

    // En cualquier otro caso durante loading → muestra spinner
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

  // Ruta pública con sesión activa (ej: usuario logueado intenta ir a /login)
  // → redirige al home automáticamente
  if (isPublic && isLogged) {
    return <Navigate to="/home" replace />;
  }

  // Ruta protegida sin sesión → redirige al login
  if (!isPublic && !isLogged) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
