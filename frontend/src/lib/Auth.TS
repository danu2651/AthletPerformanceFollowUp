import { User } from '@/types';

export const saveAuth = (token: string, user: User) => {
  localStorage.setItem('apts_token', token);
  localStorage.setItem('apts_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('apts_token');
  localStorage.removeItem('apts_user');
};

export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('apts_token') : null;

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('apts_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const isAuthenticated = (): boolean => !!getToken();

/** Format seconds → "M:SS /km" pace string */
export const formatPace = (seconds?: number): string => {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')} /km`;
};

/** Format seconds → "Xh Ym" or "Xm Ys" */
export const formatDuration = (seconds?: number): string => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

/** "MM:SS" → total seconds */
export const mmssToSeconds = (mmss: string): number => {
  const [m, s] = mmss.split(':').map(Number);
  return (m || 0) * 60 + (s || 0);
};

/** total seconds → "MM:SS" */
export const secondsToMmss = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/** "HH:MM:SS" → total seconds */
export const hhmmssToSeconds = (hhmmss: string): number => {
  const parts = hhmmss.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
};

/** total seconds → "HH:MM:SS" */
export const secondsToHhmmss = (secs: number): string => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};