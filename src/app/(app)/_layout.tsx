import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

export const unstable_settings = { anchor: '(tabs)' };

/** Tabs plus full-screen flows pushed on top (scan, wallet, cashout, KYC, invoice upload…). */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="scan" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="invoice-upload" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
