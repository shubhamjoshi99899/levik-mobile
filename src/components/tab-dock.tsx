import { useRouter } from 'expo-router';
import { TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows } from '@/theme/tokens';
import { Icon } from './ui/icon';
import { Text } from './ui/text';

/** Space screens must leave at the bottom so content clears the floating dock. */
export const DOCK_HEIGHT = 84;

// React 19: `ref` arrives as a regular prop from TabTrigger asChild.
// expo-router types the slot ref as RefAttributes<View>, which no longer matches RN 0.88's View
// typings; the runtime value is the host element ref, so pass it through.
function TabButton({ isFocused, icon, label, ref, ...props }: TabTriggerSlotProps & { icon: string; label: string }) {
  return (
    <Pressable ref={ref as never} {...props} accessibilityRole="tab" accessibilityState={{ selected: isFocused }} accessibilityLabel={label} style={styles.tab}>
      <Icon name={icon} size={24} color={isFocused ? colors.navy : colors.muted} />
      <Text variant="labelSm" color={isFocused ? colors.navy : colors.muted} style={styles.tabLabel}>
        {label}
      </Text>
      {isFocused ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

/** Solid bottom dock with a raised, gold-ringed centre action (scan for plumbers, sales to confirm for retailers). */
export function TabDock({ role }: { role: 'plumber' | 'retailer' }): ReactNode {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Retailers: confirming plumber sales is the everyday action (stock, incentive and bill in one step).
  const center = role === 'plumber' ? { icon: 'qr_code_scanner', label: 'Scan', href: '/scan' as const } : { icon: 'point_of_sale', label: 'Sales', href: '/sales' as const };
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.row}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon="home" label="Home" />
        </TabTrigger>
        <TabTrigger name="explore" href="/explore" asChild>
          <TabButton icon="explore" label="Explore" />
        </TabTrigger>
        <View style={styles.centerSlot}>
          <Pressable accessibilityRole="button" accessibilityLabel={center.label} onPress={() => router.push(center.href)} style={({ pressed }) => [styles.centerBtn, pressed && { transform: [{ scale: 0.96 }] }]}>
            <Icon name={center.icon} size={30} color={colors.goldLight} />
          </Pressable>
          <Text variant="labelSm" color={colors.navy} style={styles.centerLabel}>
            {center.label}
          </Text>
        </View>
        <TabTrigger name="rewards" href="/rewards" asChild>
          <TabButton icon="workspace_premium" label="Rewards" />
        </TabTrigger>
        <TabTrigger name="history" href="/history" asChild>
          <TabButton icon="receipt_long" label="History" />
        </TabTrigger>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Solid surface (not frosted): scrolled content must never show through the navigation.
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    overflow: 'visible',
    boxShadow: '0 -4px 16px -4px rgba(11, 30, 61, 0.08)',
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: 8, paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4, minHeight: 48 },
  tabLabel: { textTransform: 'none', letterSpacing: 0.2 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold, marginTop: 2 },
  centerSlot: { flex: 1, alignItems: 'center' },
  centerBtn: { width: 64, height: 64, marginTop: -30, borderRadius: 32, backgroundColor: colors.navy, borderWidth: 3, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', ...shadows.gold },
  centerLabel: { textTransform: 'none', letterSpacing: 0.2, marginTop: 2 },
});
