const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface AdminUser {
  id: string;
  rut: number;
  dv_rut: string;
  name: string;
  email: string | null;
  role: string;
  created_at: string;
}

const isBrowser = typeof window !== 'undefined';

export function getAdminToken(): string | null {
  if (!isBrowser) return null;
  return sessionStorage.getItem('padelhub_admin_token');
}

export function getStoredAdmin(): AdminUser | null {
  if (!isBrowser) return null;
  const raw = sessionStorage.getItem('padelhub_admin_user');
  if (!raw) return null;
  try { return JSON.parse(raw) as AdminUser; } catch { return null; }
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminToken() && !!getStoredAdmin();
}

export function clearAdminSession(): void {
  if (!isBrowser) return;
  sessionStorage.removeItem('padelhub_admin_token');
  sessionStorage.removeItem('padelhub_admin_user');
}

export async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    clearAdminSession();
    if (isBrowser) window.dispatchEvent(new Event('padelhub:admin-session-expired'));
    throw new Error('Sesión de administrador expirada');
  }

  const data = await res.json().catch(() => ({ error: 'Error de red' }));
  if (!res.ok) throw new Error(data.error ?? 'Error del servidor');
  return data as T;
}

export async function loginAdmin(rut: string, password: string): Promise<AdminUser> {
  const res = await fetch(`${API}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rut, password }),
  });
  const data = await res.json().catch(() => ({ error: 'Error de red' }));
  if (!res.ok) throw new Error(data.error ?? 'Error del servidor');

  sessionStorage.setItem('padelhub_admin_token', data.token);
  sessionStorage.setItem('padelhub_admin_user', JSON.stringify(data.user));
  return data.user as AdminUser;
}

export async function getAdminMe(): Promise<AdminUser> {
  const data = await adminFetch<{ user: AdminUser }>('/api/admin/me');
  return data.user;
}
