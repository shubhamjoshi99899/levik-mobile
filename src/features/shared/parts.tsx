import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fileSource } from '@/api/client';
import { BrandMark } from '@/components/ui/brand-mark';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { productImage } from '@/lib/product-image';
import { TERRITORY_MANAGER } from '@/mocks';
import { colors, radius, shadows, space } from '@/theme/tokens';

export function ProductThumb({ imageUrl, size = 56, label }: { imageUrl?: string | null; size?: number; label?: string }) {
  const source = productImage(imageUrl);
  return (
    <View style={[styles.thumb, { width: size, height: size }]}>
      {source ? <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={label} /> : <Icon name="bathtub" size={size / 2.4} color={colors.onNavyMuted} />}
    </View>
  );
}

/** "LEVIK / SANITARYWARE Home" bar with notifications and the user's photo (initials until one is set). */
export function HomeTopBar({ title, initials, photoUrl }: { title: string; initials: string; photoUrl?: string }) {
  const router = useRouter();
  return (
    <SafeAreaView edges={['top']} style={styles.topSafe}>
      <View style={styles.topBar}>
        <BrandMark />
        <View style={styles.flex}>
          <Text variant="labelSm" color={colors.goldInk}>
            Sanitaryware
          </Text>
          <Text variant="headlineSm" color={colors.navy}>
            {title}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Notifications" hitSlop={8} style={styles.bell}>
          <Icon name="notifications" color={colors.navy} />
          <View style={styles.bellDot} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={() => router.push('/profile')} style={styles.avatar}>
          {photoUrl ? (
            <Image source={fileSource(photoUrl)} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Text variant="labelLg" color={colors.goldLight}>
              {initials}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function initialsOf(name?: string) {
  return (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function QuickActions({ items }: { items: { icon: string; label: string; href: Href; highlight?: boolean }[] }) {
  const router = useRouter();
  return (
    <View style={styles.quick}>
      {items.map((a) => (
        <Pressable key={a.label} accessibilityRole="button" onPress={() => router.push(a.href)} style={({ pressed }) => [styles.quickItem, pressed && { opacity: 0.85 }]}>
          <View style={[styles.quickIcon, a.highlight && { backgroundColor: colors.navy }]}>
            <Icon name={a.icon} size={24} color={a.highlight ? colors.goldLight : colors.navy} />
          </View>
          <Text variant="labelMd" color={colors.inkStrong} style={styles.quickLabel}>
            {a.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Ledger/activity line: icon tile, title, subtitle, signed amount with status caption. */
export function ActivityRow({
  icon,
  tone = 'navy',
  title,
  subtitle,
  amount,
  amountTone = 'emerald',
  caption,
  onPress,
}: {
  icon: string;
  tone?: 'navy' | 'gold' | 'emerald' | 'error';
  title: string;
  subtitle?: string;
  amount?: string;
  amountTone?: 'emerald' | 'error' | 'navy' | 'gold';
  caption?: string;
  onPress?: () => void;
}) {
  const bg = { navy: colors.surfaceMid, gold: colors.goldWash, emerald: colors.emeraldWash, error: colors.errorWash }[tone];
  const fg = { navy: colors.navy, gold: colors.goldInk, emerald: colors.emeraldDeep, error: colors.error }[tone];
  const amountColor = { emerald: colors.emeraldDeep, error: colors.error, navy: colors.navy, gold: colors.goldInk }[amountTone];
  return (
    <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} style={styles.activity}>
      <View style={[styles.activityIcon, { backgroundColor: bg }]}>
        <Icon name={icon} size={22} color={fg} />
      </View>
      <View style={styles.flex}>
        <Text variant="labelLg" color={colors.inkStrong} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySm" color={colors.muted} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.amount}>
        {amount ? (
          <Text variant="headlineSm" color={amountColor} style={{ fontVariant: ['tabular-nums'] }}>
            {amount}
          </Text>
        ) : null}
        {caption ? (
          <Text variant="labelMd" color={colors.goldInk}>
            {caption}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Area territory manager card (mock contact until the API exposes it). */
export function ManagerCard() {
  return (
    <View style={styles.manager}>
      <View style={styles.managerIcon}>
        <Icon name="support_agent" size={22} color={colors.goldInk} />
      </View>
      <View style={styles.flex}>
        <Text variant="labelLg" color={colors.inkStrong}>
          Area Territory Manager: {TERRITORY_MANAGER.name}
        </Text>
        <Text variant="bodySm" color={colors.muted}>
          {TERRITORY_MANAGER.phone} ({TERRITORY_MANAGER.zone})
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Call ${TERRITORY_MANAGER.name}`} onPress={() => void Linking.openURL(`tel:${TERRITORY_MANAGER.phone.replace(/\s/g, '')}`)} style={styles.call}>
        <Icon name="call" size={20} color={colors.navy} />
      </Pressable>
    </View>
  );
}

export function StatTile({ label, value, hint, icon, tone = 'navy', children }: { label: string; value: string; hint?: string; icon?: string; tone?: 'navy' | 'gold' | 'emerald' | 'error'; children?: ReactNode }) {
  const color = { navy: colors.navy, gold: colors.goldInk, emerald: colors.emeraldDeep, error: colors.error }[tone];
  return (
    <View style={styles.stat}>
      <View style={styles.statHead}>
        <Text variant="labelMd" color={colors.slate}>
          {label}
        </Text>
        {icon ? (
          <View style={styles.statIcon}>
            <Icon name={icon} size={16} color={color} />
          </View>
        ) : null}
      </View>
      <Text variant="headlineLg" color={tone === 'error' ? colors.error : colors.inkStrong} style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      {hint ? (
        <Text variant="bodySm" color={tone === 'navy' ? colors.muted : color}>
          {hint}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  thumb: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.slate, alignItems: 'center', justifyContent: 'center' },
  topSafe: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  bell: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, borderWidth: 1.5, borderColor: colors.surface },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.goldLight, overflow: 'hidden' },
  quick: { flexDirection: 'row', gap: space.sm },
  quickItem: { flex: 1, alignItems: 'center', gap: space.sm, paddingVertical: space.lg, paddingHorizontal: 4, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card },
  quickIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { textAlign: 'center' },
  activity: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  activityIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  amount: { alignItems: 'flex-end' },
  manager: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surfaceLow },
  managerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.goldWash, alignItems: 'center', justifyContent: 'center' },
  call: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  stat: { flex: 1, gap: 4, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card },
  statHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' },
});
