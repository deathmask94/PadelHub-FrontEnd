import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import {
  loginUser,
  registerUser,
  logoutUser,
  updateProfile,
  getStoredUser,
  isAuthenticated,
  type FrontendUser,
} from "~/services/auth";

interface AuthContextType {
  user: FrontendUser | null;
  isLogged: boolean;
  loading: boolean;
  login: (rut: string, password: string) => Promise<void>;
  register: (data: {
    rut: string;
    dv_rut: string;
    phone: string;
    name: string;
    email?: string;
    password: string;
    zone: string;
    gender: "masculino" | "femenino";
    birth_date?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  editarPerfil: (data: Partial<FrontendUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FrontendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated()) setUser(getStoredUser());
    setLoading(false);
  }, []);

  useEffect(() => {
    window.addEventListener("padelhub:session-expired", handleSessionExpired);
    return () => window.removeEventListener("padelhub:session-expired", handleSessionExpired);
  }, [handleSessionExpired]);

  const login = async (rut: string, password: string) => {
    const { user } = await loginUser(rut, password);
    setUser(user);
  };

  const register = async (data: {
    rut: string;
    dv_rut: string;
    phone: string;
    name: string;
    email?: string;
    password: string;
    zone: string;
    gender: "masculino" | "femenino";
    birth_date?: string;
  }) => {
    const { user } = await registerUser(data);
    setUser(user);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const editarPerfil = async (data: Partial<FrontendUser>) => {
    if (!user) return;
    const updated = await updateProfile(user.rut, data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLogged: !!user, loading, login, register, logout, editarPerfil }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
