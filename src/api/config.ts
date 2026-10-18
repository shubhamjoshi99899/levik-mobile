import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * API origin. EXPO_PUBLIC_API_URL wins; otherwise, in development, use the machine running the Expo dev
 * server (so Expo Go on a phone reaches the API on your Mac's LAN IP instead of the phone's localhost).
 */
function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (Platform.OS === 'web') return 'http://localhost:4100';
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:4100`;
}

export const API_URL = resolveApiUrl();
