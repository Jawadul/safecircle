/**
 * api.client.ts — Typed API client for SafeCircle backend.
 * Automatically refreshes JWT on 401 responses.
 */
import Constants from 'expo-constants';

import type {
  AuthResponse,
  TrustedContact,
  SafetySession,
  AlertEvent,
  AddContactDto,
  StartCheckInDto,
  StartSafeRideDto,
  StartWalkAloneDto,
  StartSOSDto,
} from '@safecircle/shared-types';
import { useAuthStore } from '../stores/auth.store';

const BASE_URL = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ?? 'http://localhost:3000';
const API_PREFIX = `${BASE_URL}/api/v1`;

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const { tokens } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  const res = await fetch(`${API_PREFIX}${path}`, { ...options, headers });

  // Token refresh on 401
  if (res.status === 401 && retry && tokens?.refreshToken) {
    const refreshed = await refreshTokens(tokens.refreshToken);
    if (refreshed) {
      return request<T>(path, options, false);
    }
    useAuthStore.getState().clearAuth();
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({ message: 'Unknown error' }))) as { message?: string };
    throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function refreshTokens(refreshToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_PREFIX}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as AuthResponse;
    useAuthStore.getState().setAuth(data.user, data.tokens);
    return true;
  } catch {
    return false;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  requestOtp: (phone: string) =>
    request<{ message: string }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: (phone: string, otp: string) =>
    request<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),

  logout: (refreshToken: string) =>
    request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  registerPushToken: (token: string) =>
    request<void>('/auth/push-token', { method: 'POST', body: JSON.stringify({ token }) }),

  removePushToken: (token: string) =>
    request<void>('/auth/push-token', { method: 'DELETE', body: JSON.stringify({ token }) }),
};

// ─── Contacts ─────────────────────────────────────────────────────────────────

export const contactsApi = {
  list: () => request<TrustedContact[]>('/contacts'),

  add: (dto: AddContactDto) =>
    request<TrustedContact>('/contacts', { method: 'POST', body: JSON.stringify(dto) }),

  remove: (id: string) => request<void>(`/contacts/${id}`, { method: 'DELETE' }),
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsApi = {
  startCheckIn: (dto: StartCheckInDto) =>
    request<SafetySession>('/sessions/checkin', { method: 'POST', body: JSON.stringify(dto) }),

  startSafeRide: (dto: StartSafeRideDto) =>
    request<SafetySession>('/sessions/saferide', { method: 'POST', body: JSON.stringify(dto) }),

  startWalkAlone: (dto: StartWalkAloneDto) =>
    request<SafetySession>('/sessions/walkalone', { method: 'POST', body: JSON.stringify(dto) }),

  startSOS: (dto: StartSOSDto) =>
    request<SafetySession>('/sessions/sos', { method: 'POST', body: JSON.stringify(dto) }),

  get: (id: string) => request<SafetySession>(`/sessions/${id}`),

  end: (id: string) =>
    request<SafetySession>(`/sessions/${id}/end`, { method: 'POST' }),
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const alertsApi = {
  getBySession: (sessionId: string) =>
    request<AlertEvent[]>(`/alerts/session/${sessionId}`),

  acknowledge: (alertId: string, contactId: string) =>
    request<void>(`/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
      body: JSON.stringify({ contactId }),
    }),
};
