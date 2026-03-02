/**
 * session.store.ts — Central Zustand store for safety sessions.
 * All session screens and hooks depend on this store.
 *
 * State machine:
 *   IDLE → SETTING_UP → ACTIVE → COMPLETED | ESCALATED | CANCELLED
 */
import { create } from 'zustand';

import type {
  SafetySession,
  SessionType,
  SessionStatus,
  LocationPing,
  CheckInSubStatus,
  SafeRideSubStatus,
  WalkAloneSubStatus,
  SOSSubStatus,
} from '@safecircle/shared-types';

type SubStatus =
  | CheckInSubStatus
  | SafeRideSubStatus
  | WalkAloneSubStatus
  | SOSSubStatus
  | null;

interface SessionState {
  // Current active session
  activeSession: SafetySession | null;
  sessionStatus: SessionStatus;
  subStatus: SubStatus;

  // Location tracking
  isTracking: boolean;
  lastLocation: LocationPing | null;
  locationError: string | null;

  // UI state
  isSettingUp: boolean;
  setupError: string | null;

  // Actions
  setActiveSession: (session: SafetySession) => void;
  updateSessionStatus: (status: SessionStatus, subStatus?: SubStatus) => void;
  setLastLocation: (location: LocationPing) => void;
  setLocationError: (error: string | null) => void;
  setTracking: (tracking: boolean) => void;
  setSettingUp: (settingUp: boolean) => void;
  setSetupError: (error: string | null) => void;
  endSession: () => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  activeSession: null,
  sessionStatus: 'IDLE',
  subStatus: null,
  isTracking: false,
  lastLocation: null,
  locationError: null,
  isSettingUp: false,
  setupError: null,

  setActiveSession: (session) =>
    set({
      activeSession: session,
      sessionStatus: session.status,
      subStatus: session.subStatus as SubStatus,
      isSettingUp: false,
      setupError: null,
    }),

  updateSessionStatus: (status, subStatus) =>
    set((state) => ({
      sessionStatus: status,
      subStatus: subStatus ?? state.subStatus,
      activeSession: state.activeSession
        ? { ...state.activeSession, status }
        : null,
    })),

  setLastLocation: (location) => set({ lastLocation: location, locationError: null }),

  setLocationError: (error) => set({ locationError: error }),

  setTracking: (isTracking) => set({ isTracking }),

  setSettingUp: (isSettingUp) => set({ isSettingUp }),

  setSetupError: (setupError) => set({ setupError }),

  endSession: () =>
    set((state) => ({
      sessionStatus: 'COMPLETED',
      isTracking: false,
      activeSession: state.activeSession
        ? { ...state.activeSession, status: 'COMPLETED', endedAt: new Date().toISOString() }
        : null,
    })),

  resetSession: () =>
    set({
      activeSession: null,
      sessionStatus: 'IDLE',
      subStatus: null,
      isTracking: false,
      lastLocation: null,
      locationError: null,
      isSettingUp: false,
      setupError: null,
    }),
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectActiveSession = (s: SessionState) => s.activeSession;
export const selectIsActive = (s: SessionState) => s.sessionStatus === 'ACTIVE';
export const selectIsTracking = (s: SessionState) => s.isTracking;
export const selectSessionType = (s: SessionState): SessionType | null =>
  s.activeSession?.type ?? null;
