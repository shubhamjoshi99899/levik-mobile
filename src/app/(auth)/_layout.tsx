import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

/** Landing screen when the root guard redirects into this group. */
export const unstable_settings = { anchor: 'welcome' };

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
