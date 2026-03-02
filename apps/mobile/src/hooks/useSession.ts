/**
 * useSession.ts — Hook for managing session lifecycle (start, track, end).
 */
import { useCallback } from 'react';

import type {
  StartCheckInDto,
  StartSafeRideDto,
  StartWalkAloneDto,
  StartSOSDto,
} from '@safecircle/shared-types';
import { sessionsApi } from '../services/api.client';
import { WebSocketManager } from '../services/websocket.manager';
import { startBackgroundTracking, stopBackgroundTracking } from '../tasks/location.task';
import { useSessionStore } from '../stores/session.store';

export function useSession() {
  const store = useSessionStore();

  const startCheckIn = useCallback(async (dto: StartCheckInDto) => {
    store.setSettingUp(true);
    try {
      const session = await sessionsApi.startCheckIn(dto);
      store.setActiveSession(session as Parameters<typeof store.setActiveSession>[0]);
      await WebSocketManager.joinSession(session.id, 'owner');
      await startBackgroundTracking();
      store.setTracking(true);
    } catch (err) {
      store.setSetupError(err instanceof Error ? err.message : 'Failed to start check-in');
      store.setSettingUp(false);
    }
  }, [store]);

  const startSafeRide = useCallback(async (dto: StartSafeRideDto) => {
    store.setSettingUp(true);
    try {
      const session = await sessionsApi.startSafeRide(dto);
      store.setActiveSession(session as Parameters<typeof store.setActiveSession>[0]);
      await WebSocketManager.joinSession(session.id, 'owner');
      await startBackgroundTracking();
      store.setTracking(true);
    } catch (err) {
      store.setSetupError(err instanceof Error ? err.message : 'Failed to start safe ride');
      store.setSettingUp(false);
    }
  }, [store]);

  const startWalkAlone = useCallback(async (dto: StartWalkAloneDto) => {
    store.setSettingUp(true);
    try {
      const session = await sessionsApi.startWalkAlone(dto);
      store.setActiveSession(session as Parameters<typeof store.setActiveSession>[0]);
      await WebSocketManager.joinSession(session.id, 'owner');
      await startBackgroundTracking();
      store.setTracking(true);
    } catch (err) {
      store.setSetupError(err instanceof Error ? err.message : 'Failed to start walk');
      store.setSettingUp(false);
    }
  }, [store]);

  const triggerSOS = useCallback(async (dto: StartSOSDto = {}) => {
    try {
      const session = await sessionsApi.startSOS(dto);
      store.setActiveSession(session as Parameters<typeof store.setActiveSession>[0]);
      await WebSocketManager.joinSession(session.id, 'owner');
      await startBackgroundTracking();
      store.setTracking(true);
    } catch (err) {
      store.setSetupError(err instanceof Error ? err.message : 'SOS failed to trigger');
    }
  }, [store]);

  const endSession = useCallback(async () => {
    const { activeSession } = store;
    if (!activeSession) return;

    try {
      await sessionsApi.end(activeSession.id);
      WebSocketManager.leaveSession(activeSession.id);
      await stopBackgroundTracking();
      store.endSession();
    } catch (err) {
      console.error('Failed to end session:', err);
      store.endSession(); // force end locally even if API fails
    }
  }, [store]);

  return {
    activeSession: store.activeSession,
    sessionStatus: store.sessionStatus,
    isTracking: store.isTracking,
    isSettingUp: store.isSettingUp,
    setupError: store.setupError,
    startCheckIn,
    startSafeRide,
    startWalkAlone,
    triggerSOS,
    endSession,
  };
}
