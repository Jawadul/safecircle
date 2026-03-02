import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'SafeCircle',
  slug: 'safecircle',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'safecircle',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#7C3AED',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.safecircle.app',
    buildNumber: '1',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'SafeCircle uses your location during active safety sessions to protect you.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'SafeCircle uses your background location during active safety sessions to protect you even when the app is in the background.',
      NSLocationAlwaysUsageDescription:
        'SafeCircle needs background location access for active safety sessions.',
      UIBackgroundModes: ['location', 'remote-notification'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#7C3AED',
    },
    package: 'com.safecircle.app',
    versionCode: 1,
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'RECEIVE_BOOT_COMPLETED',
    ],
    googleServicesFile: './google-services.json',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'SafeCircle uses your location during active safety sessions.',
        locationAlwaysPermission:
          'SafeCircle uses background location during active safety sessions.',
        locationWhenInUsePermission:
          'SafeCircle uses your location for safety sessions.',
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#7C3AED',
        sounds: ['./assets/sounds/alert.wav'],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000',
    wsUrl: process.env['EXPO_PUBLIC_WS_URL'] ?? 'ws://localhost:3000',
    googleMapsApiKey: process.env['EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'] ?? '',
    eas: {
      projectId: 'your-eas-project-id',
    },
  },
});
