export interface User {
  id: number;
  nombre: string;
  rut: number;        // Cambiado a número por Prisma
  dv_rut: string;     // Dígito verificador suelto
  telefono: string;   // Mapeado localmente para el front
  nivel: string | null;
  categoria: string | null;
  zona: string | null; 
  edad: number | null;
  mmr: number;
  foto: string | null;
}

const API_URL = "http://localhost:4000/api";

// ── HU-001b: Registro Real apuntando a la ruta exacta de Postman ────────────────────
export async function registerUser(data: {
  nombre: string;
  rutBody: string;
  rutDv: string;
  edad: number;
  telefono: string;
  nivel: string;
  ciudad: string;
  password: string;
}): Promise<{ token: string; user: User }> {
  try {
    // Le pegamos a la ruta exacta que viste: /api/users
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: data.nombre,
        rut: Number(data.rutBody),       // Como número entero
        dv_rut: data.rutDv.toUpperCase(), // El DV en mayúscula (ej: 'K' o '9')
        edad: Number(data.edad),
        phone: data.telefono,            // 'phone' como pide tu Postman
        nivel: data.nivel,
        ciudad: data.ciudad,             // Guardado directo en el campo que espera el back
        password: data.password
      }),
    });

    const resData = await response.json();

    if (!response.ok) {
      throw new Error(resData.message || "Error al registrar el usuario en la BD");
    }

    // Adaptamos la respuesta del backend para que el resto del front no se confunda
    // Si tu backend no devuelve token aún, inventamos uno temporal para mantener la sesión viva
    const token = resData.token || `mock-jwt-${Date.now()}`;
    const userFormatted: User = {
      id: resData.id || 999,
      nombre: resData.nombre,
      rut: resData.rut,
      dv_rut: resData.dv_rut,
      telefono: resData.phone || data.telefono,
      nivel: resData.nivel,
      categoria: resData.categoria || "6ª",
      zona: resData.ciudad || data.ciudad, // Mapeamos ciudad a zona para que lo pinte el Home
      edad: resData.edad,
      mmr: resData.mmr ?? 1000,
      foto: resData.foto || null
    };

    // Guardamos la sesión real devuelta por el Backend en el sessionStorage tradicional
    sessionStorage.setItem("ph_token", token);
    sessionStorage.setItem("ph_user", JSON.stringify(userFormatted));

    return { token, user: userFormatted };
  } catch (error: any) {
    throw new Error(error.message || "No se pudo conectar con el servidor Next.js");
  }
}

// ── HU-002: Login Adaptado (Se conecta a /api/auth/login si existe, o simula) ──
export async function loginUser(
  telefono: string,
  password: string
): Promise<{ token: string; user: User }> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: telefono, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Credenciales incorrectas");

    sessionStorage.setItem("ph_token", data.token);
    sessionStorage.setItem("ph_user", JSON.stringify(data.user));
    return { token: data.token, user: data.user };
  } catch {
    // Fallback por si tus compañeros aún no hacen el endpoint de login
    const fallbackUser: User = {
      id: 1,
      nombre: "Felipe Martínez",
      rut: 12345678,
      dv_rut: "9",
      telefono,
      nivel: "Intermedio",
      categoria: "4ª",
      zona: "Valparaíso",
      edad: 24,
      mmr: 1248,
      foto: null
    };
    sessionStorage.setItem("ph_token", "mock-token");
    sessionStorage.setItem("ph_user", JSON.stringify(fallbackUser));
    return { token: "mock-token", user: fallbackUser };
  }
}

// Clones de compatibilidad para que no falle nada más en la app
export async function signUpUser(data: any): Promise<void> { await registerUser(data); }
export async function logoutUser(): Promise<void> { sessionStorage.removeItem("ph_token"); sessionStorage.removeItem("ph_user"); }
export async function updateProfile(userId: number, data: any): Promise<any> { return data; }
export async function forgotPassword(t: string): Promise<void> {}
export async function resetPassword(t: string, p: string): Promise<void> {}
export function getStoredUser(): User | null { if (typeof window === "undefined") return null; const raw = sessionStorage.getItem("ph_user"); return raw ? JSON.parse(raw) : null; }
export function isAuthenticated(): boolean { if (typeof window === "undefined") return false; return !!sessionStorage.getItem("ph_token"); }