import { apiFetch } from './auth';

export interface Match {
  id: string;
  organizer_id: string;
  club: string;
  format: 'doubles' | 'singles';
  status: 'open' | 'confirmed' | 'in_progress' | 'finished' | 'cancelled';
  match_date: string;
  match_time: string;
  created_at: string;
  updated_at: string;
  users?: { name: string; phone?: string; level?: string; mmr?: number; photo_url?: string | null; zone?: string };
  max_players?: number;
  player_count?: number;
  available_slots?: number;
  match_players?: { user_id: string; status: string }[];
}

export interface CreateMatchPayload {
  organizer_id: string;
  club: string;
  format?: 'doubles' | 'singles';
  match_date: string;
  match_time: string;
}

export interface MatchFilters {
  zone?: string;
  format?: 'doubles' | 'singles';
  date?: 'today' | 'week';
}

export async function getMatches(filters?: MatchFilters): Promise<Match[]> {
  const params = new URLSearchParams();
  if (filters?.zone)   params.set('zone',   filters.zone);
  if (filters?.format) params.set('format', filters.format);
  if (filters?.date)   params.set('date',   filters.date);
  const qs = params.toString();
  return apiFetch<Match[]>(`/api/matches${qs ? `?${qs}` : ''}`);
}

export async function getMyMatches(): Promise<Match[]> {
  return apiFetch<Match[]>('/api/matches/my');
}

export async function createMatch(payload: CreateMatchPayload): Promise<Match> {
  const data = await apiFetch<{ match: Match }>('/api/matches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.match;
}

export async function joinMatch(matchId: string): Promise<void> {
  await apiFetch(`/api/matches/${matchId}/join`, { method: 'POST' });
}

export interface RankingEntry {
  position: number;
  id:       string;
  rut:      number;
  dv_rut:   string;
  name:     string;
  zone:     string;
  level:    string;
  mmr:      number;
}

export async function searchPlayers(q: string, level?: string): Promise<{
  id: string; name: string; photo_url: string | null; level: string; mmr: number; zone: string;
}[]> {
  const qs = `?q=${encodeURIComponent(q)}${level ? `&level=${level}` : ''}`;
  return apiFetch(`/api/users/search${qs}`);
}

export async function invitePlayer(matchId: string, userId: string): Promise<void> {
  await apiFetch(`/api/matches/${matchId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function respondInvitation(matchId: string, accept: boolean): Promise<void> {
  await apiFetch(`/api/matches/${matchId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  });
}

export async function getRanking(zone?: string): Promise<RankingEntry[]> {
  const qs = zone ? `?zone=${encodeURIComponent(zone)}` : '';
  return apiFetch<RankingEntry[]>(`/api/ranking${qs}`);
}
