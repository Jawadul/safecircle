/**
 * Root layout — registers background tasks, handles auth navigation.
 * IMPORTANT: Background task imports must be at root level.
 */
import '../src/tasks/location.task'; // registers TaskManager task at startup

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { useAuthStore } from '../src/stores/auth.store';
import { authApi } from '../src/services/api.client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerPushToken(): Promise<void> {
  // Push tokens only work on physical devices (not Expo Go simulator)
  if (!Constants.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  const { status } = existing === 'granted'
    ? { status: existing }
    : await Notifications.requestPermissionsAsync();

  if (status !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  await authApi.registerPushToken(tokenData.data).catch(() => {
    // Non-fatal: token will be registered next time
  });
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)/home');
    }

    if (isAuthenticated) {
      registerPushToken().catch(console.error);
    }
  }, [isAuthenticated, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen
          name="sos/index"
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </AuthGuard>
  );
}
