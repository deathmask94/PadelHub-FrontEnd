const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface User {
  id: string;
  rut: number;
  dv_rut: string;
  phone: string;
  name: string;
  photo_url: string | null;
  level: string;
  zone: string;
  mmr: number;
  role: string;
  is_active: boolean;
  reminder_enabled?: boolean;
  created_at: string;
  updated_at: string;
  birth_date?: string | null;
  categoria?: string;
}

// Aliases usados en los componentes del frontend
export interface FrontendUser extends User {
  nombre: string;
  zona: string;
  nivel: string;
}

function normalizeUser(user: User): FrontendUser {
  return {
    ...user,
    nombre: user.name,
    zona: user.zone,
    nivel: user.level,
  };
}

const isBrowser = typeof window !== 'undefined';

export function getToken(): string | null {
  if (!isBrowser) return null;
  return sessionStorage.getItem('padelhub_token');
}

export function getRefreshToken(): string | null {
  if (!isBrowser) return null;
  return sessionStorage.getItem('padelhub_refresh');
}

export function getStoredUser(): FrontendUser | null {
  if (!isBrowser) return null;
  const raw = sessionStorage.getItem('padelhub_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FrontendUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (!isBrowser) return false;
  return !!getToken() && !!getStoredUser();
}

function saveSession(user: User, token: string, refreshToken?: string): FrontendUser {
  const normalized = normalizeUser(user);
  sessionStorage.setItem('padelhub_token', token);
  sessionStorage.setItem('padelhub_user', JSON.stringify(normalized));
  if (refreshToken) sessionStorage.setItem('padelhub_refresh', refreshToken);
  return normalized;
}

export function clearSession(): void {
  if (!isBrowser) return;
  sessionStorage.removeItem('padelhub_token');
  sessionStorage.removeItem('padelhub_user');
  sessionStorage.removeItem('padelhub_refresh');
}

async function refreshAccessToken(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) { clearSession(); return false; }
    const data = await res.json();
    sessionStorage.setItem('padelhub_token', data.token);
    sessionStorage.setItem('padelhub_refresh', data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetch<T>(path, options, true);
    clearSession();
    if (isBrowser) window.dispatchEvent(new Event('padelhub:session-expired'));
    throw new Error('Sesión expirada');
  }

  const data = await res.json().catch(() => ({ error: 'Error de red' }));
  if (!res.ok) throw new Error(data.error ?? 'Error del servidor');
  return data as T;
}

export async function loginUser(rut: string, password: string): Promise<{ user: FrontendUser }> {
  const data = await apiFetch<{ user: User; token: string; refreshToken: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ rut, password }),
  });
  const user = saveSession(data.user, data.token, data.refreshToken);
  return { user };
}

export async function registerUser(params: {
  rut: string;
  dv_rut: string;
  phone: string;
  name: string;
  email?: string;
  password: string;
  zone: string;
  birth_date?: string;
}): Promise<{ user: FrontendUser }> {
  const data = await apiFetch<{ user: User; token: string; refreshToken: string }>('/api/users', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  const user = saveSession(data.user, data.token, data.refreshToken);
  return { user };
}

export async function logoutUser(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } finally {
    clearSession();
  }
}

export async function uploadProfilePhoto(rut: number, file: File): Promise<string> {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API}/api/users/${rut}/profile/photo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = await res.json().catch(() => ({ error: 'Error de red' }));
  if (!res.ok) throw new Error(data.error ?? 'Error al subir la foto');

  const current = getStoredUser();
  if (current) {
    const updated = { ...current, photo_url: data.photo_url };
    sessionStorage.setItem('padelhub_user', JSON.stringify(updated));
  }
  return data.photo_url as string;
}

export async function deleteProfilePhoto(rut: number): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API}/api/users/${rut}/profile/photo`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Error al eliminar la foto');
  }
  const current = getStoredUser();
  if (current) {
    sessionStorage.setItem('padelhub_user', JSON.stringify({ ...current, photo_url: null }));
  }
}

export async function updateProfile(
  rut: number,
  updates: Partial<FrontendUser>
): Promise<FrontendUser> {
  const backendUpdates: Record<string, unknown> = {};
  if (updates.nombre            !== undefined) backendUpdates.name             = updates.nombre;
  if (updates.zona              !== undefined) backendUpdates.zone             = updates.zona;
  if (updates.reminder_enabled  !== undefined) backendUpdates.reminder_enabled = updates.reminder_enabled;

  const data = await apiFetch<{ user: User }>(`/api/users/${rut}/profile`, {
    method: 'PUT',
    body: JSON.stringify(backendUpdates),
  });

  const current = getStoredUser()!;
  const updated: FrontendUser = {
    ...current,
    ...normalizeUser(data.user),
  };
  sessionStorage.setItem('padelhub_user', JSON.stringify(updated));
  return updated;
}
