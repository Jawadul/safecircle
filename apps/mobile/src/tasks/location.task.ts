/**
 * location.task.ts — Expo TaskManager background location task.
 * Sends location pings via WebSocket even when the app is backgrounded.
 *
 * IMPORTANT: This file must be imported in the root _layout.tsx (not lazily).
 * Expo TaskManager requires tasks to be registered at app startup.
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { WebSocketManager } from '../services/websocket.manager';
import { useSessionStore } from '../stores/session.store';

export const BACKGROUND_LOCATION_TASK = 'SAFECIRCLE_BACKGROUND_LOCATION';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error.message);
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  const latest = locations[locations.length - 1]!;
  const { activeSession } = useSessionStore.getState();
  if (!activeSession) return;

  const locationPing = {
    lat: latest.coords.latitude,
    lng: latest.coords.longitude,
    accuracy: latest.coords.accuracy ?? 0,
    altitude: latest.coords.altitude ?? null,
    speed: latest.coords.speed ?? null,
    heading: latest.coords.heading ?? null,
    timestamp: new Date(latest.timestamp).toISOString(),
  };

  useSessionStore.getState().setLastLocation(locationPing);

  try {
    await WebSocketManager.sendLocation({
      sessionId: activeSession.id,
      location: locationPing,
    });
  } catch (err) {
    console.error('Failed to send background location:', err);
  }
});

export async function startBackgroundTracking(): Promise<void> {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    throw new Error('Foreground location permission denied');
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== 'granted') {
    throw new Error('Background location permission denied');
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRegistered) return;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 5000,       // every 5 seconds
    distanceInterval: 10,     // or every 10 metres, whichever comes first
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'SafeCircle Active',
      notificationBody: 'Your safety session is active. Location is being tracked.',
      notificationColor: '#7C3AED',
    },
  });
}

export async function stopBackgroundTracking(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}
