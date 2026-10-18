import { useSyncExternalStore } from 'react';
import { API_URL } from './config';
import { ApiError } from './errors';
import { secureStorage } from './storage';

/**
 * Participant session for the mobile app.
 * - Access token (15 min) is kept in memory only.
 * - The rotating refresh token lives in SecureStore (Keychain/Keystore), so the app stays signed in.
 * - A "guest" has verified their phone by OTP but has not registered as a plumber or retailer yet.
 */
export type Role = 'plumber' | 'retailer' | 'guest';

export interface SessionUser {
  id: string;
  role: Role;
  name?: string;
  phone?: string;
}

export type SessionState = { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; user: SessionUser };

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

const REFRESH_KEY = 'levik.refreshToken';

let accessToken: string | null = null;
let state: SessionState = { status: 'loading' };
let inflight: Promise<string | null> | null = null;
let started = false;
const listeners = new Set<() => void>();

function setState(next: SessionState) {
  state = next;
  for (const l of listeners) l();
}

async function accept(tokens: TokenResponse) {
  accessToken = tokens.accessToken;
  await secureStorage.set(REFRESH_KEY, tokens.refreshToken);
  setState({ status: 'signedIn', user: tokens.user });
  return tokens.user;
}

async function clear() {
  accessToken = null;
  await secureStorage.set(REFRESH_KEY, null);
  setState({ status: 'signedOut' });
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** Rotates the refresh token. Returns a new access token, or null when the session is gone. */
export function refreshAccessToken(): Promise<string | null> {
  inflight ??= (async () => {
    const refreshToken = await secureStorage.get(REFRESH_KEY);
    if (!refreshToken) {
      await clear();
      return null;
    }
    try {
      const tokens = await post<TokenResponse>('/api/v1/auth/refresh', { refreshToken });
      if (tokens.user.role !== 'plumber' && tokens.user.role !== 'retailer' && tokens.user.role !== 'guest') {
        throw new ApiError(403, 'FORBIDDEN', 'Admin accounts sign in on the Levik admin portal.');
      }
      await accept(tokens);
      return tokens.accessToken;
    } catch (error) {
      // Rejected token → sign out. Offline → keep the token and stay on the splash/sign-in.
      if (error instanceof ApiError) await clear();
      else if (state.status === 'loading') setState({ status: 'signedOut' });
      return null;
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

export const getAccessToken = () => accessToken;

export function requestOtp(phone: string) {
  return post<{ expiresIn: number }>('/api/v1/auth/otp/request', { phone });
}

export async function verifyOtp(phone: string, code: string): Promise<SessionUser> {
  const tokens = await post<TokenResponse>('/api/v1/auth/otp/verify', { phone, code });
  if (tokens.user.role === ('admin' as Role)) throw new ApiError(403, 'FORBIDDEN', 'Admin accounts sign in on the Levik admin portal.');
  return accept(tokens);
}

/** Registration returns a fresh token pair for the new plumber/retailer identity. */
export function acceptTokens(tokens: TokenResponse) {
  return accept(tokens);
}

export async function signOut() {
  const refreshToken = await secureStorage.get(REFRESH_KEY);
  await clear();
  if (refreshToken) await post('/api/v1/auth/logout', { refreshToken }).catch(() => undefined);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    void refreshAccessToken();
  }
  return () => listeners.delete(listener);
}

const getState = () => state;

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getState, getState);
}
