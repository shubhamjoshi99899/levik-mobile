import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

/** Landing screen when the root guard redirects into this group. */
export const unstable_settings = { anchor: 'role' };

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
