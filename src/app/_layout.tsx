import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { InterTight_500Medium, InterTight_600SemiBold, useFonts } from '@expo-google-fonts/inter-tight';
import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/api/client';
import { useSession } from '@/api/session';
import { colors } from '@/theme/tokens';
import { useApplyUpdateOnLaunch } from '@/lib/updates';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useApplyUpdateOnLaunch();
  const [fontsLoaded, fontError] = useFonts({ InterTight_500Medium, InterTight_600SemiBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const session = useSession();
  const ready = (fontsLoaded || Boolean(fontError)) && session.status !== 'loading';

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;

  const role = session.status === 'signedIn' ? session.user.role : null;
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          {/* Plumbers and retailers. A failed guard falls through to the first allowed group's anchor
              (welcome for signed-out users, role selection for guests). */}
          <Stack.Protected guard={role === 'plumber' || role === 'retailer'}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          {/* Phone verified by OTP, not registered yet */}
          <Stack.Protected guard={role === 'guest'}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>
          {/* Signed out */}
          <Stack.Protected guard={role === null}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
