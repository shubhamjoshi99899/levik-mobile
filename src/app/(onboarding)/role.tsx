import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { signOut } from '@/api/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppHeader, Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { colors, radius, shadows, space } from '@/theme/tokens';

type Role = 'plumber' | 'retailer';

const ROLES: { role: Role; icon: string; eyebrow: string; title: string; badge: string; points: string[]; image: number; caption: string; captionIcon: string }[] = [
  {
    role: 'plumber',
    icon: 'plumbing',
    eyebrow: 'Installer & Technician',
    title: 'I am a Plumber / Contractor',
    badge: 'Over 24,000+ plumbers enrolled',
    points: ['Scan product cartons & QR codes on job sites', 'Earn instant points on every eligible luxury fixture', 'Redeem for home appliances, specialised tools & digital vouchers'],
    image: require('@/assets/products/9001.jpg'),
    caption: 'Instant hardware accrual ready',
    captionIcon: 'qr_code_scanner',
  },
  {
    role: 'retailer',
    icon: 'storefront',
    eyebrow: 'Dealer & Distributor',
    title: 'I am a Retailer / Shop Owner',
    badge: 'Authorized partner network',
    points: ['Upload dealer invoices for wholesale turnover bonuses', 'Access live B2B trade bonanzas & exclusive margin schemes', 'Manage store inventory & get territory manager support'],
    image: require('@/assets/images/brand-cover.jpg'),
    caption: 'Trade ledger & bonus portal',
    captionIcon: 'analytics',
  },
];

export default function SelectRole() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('plumber');
  return (
    <Screen
      header={
        <AppHeader
          eyebrow="Levik Luxury"
          title="Trade Profile Setup"
          right={
            <Pressable accessibilityRole="button" accessibilityLabel="Use a different number" onPress={() => void signOut()} hitSlop={8}>
              <Icon name="logout" color={colors.slate} />
            </Pressable>
          }
        />
      }
      footer={
        <View style={styles.footer}>
          <Button title={`Continue as ${role === 'plumber' ? 'Plumber' : 'Retailer'}`} trailingIcon="arrow_forward" onPress={() => router.push({ pathname: '/register', params: { role } })} />
          <View style={styles.member}>
            <Icon name="verified_user" size={14} color={colors.emerald} />
            <Text variant="labelMd" color={colors.slate}>
              Verified Levik Ceramic Trade Membership
            </Text>
          </View>
        </View>
      }
    >
      <View style={styles.steps}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.step, i < 2 && styles.stepDone]} />
        ))}
      </View>
      <View style={styles.head}>
        <Badge label="Step 2 of 3" tone="gold" />
        <Text variant="headlineXl" color={colors.inkStrong}>
          Select Your Profile
        </Text>
        <Text variant="bodyLg" color={colors.muted}>
          Choose how you partner with Levik to personalise your catalogue, rewards and sales tools.
        </Text>
      </View>

      {ROLES.map((r) => {
        const active = role === r.role;
        return (
          <Pressable key={r.role} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setRole(r.role)} style={[styles.card, active && styles.cardActive]}>
            {active ? <LinearGradient colors={[colors.goldInk, colors.goldLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.topBar} /> : null}
            <View style={styles.cardHead}>
              <View style={[styles.roleIcon, active && { backgroundColor: colors.goldSoft }]}>
                <Icon name={r.icon} size={28} color={active ? colors.goldInk : colors.navy} />
              </View>
              <View style={styles.flex}>
                <Text variant="labelSm" color={colors.goldInk}>
                  {r.eyebrow}
                </Text>
                <Text variant="headlineSm" color={colors.inkStrong}>
                  {r.title}
                </Text>
              </View>
              <View style={[styles.radio, active && styles.radioOn]}>{active ? <Icon name="check" size={16} color={colors.white} /> : null}</View>
            </View>
            <Badge label={r.badge} tone={active ? 'navy' : 'neutral'} icon="workspace_premium" uppercase={false} />
            {r.points.map((p) => (
              <View key={p} style={styles.point}>
                <Icon name="check_circle" size={18} color={active ? colors.goldInk : colors.faint} />
                <Text variant="body" color={colors.ink} style={styles.flex}>
                  {p}
                </Text>
              </View>
            ))}
            <View style={styles.image}>
              <Image source={r.image} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={['transparent', 'rgba(11,30,61,0.85)']} style={StyleSheet.absoluteFill} />
              <View style={styles.caption}>
                <Icon name={r.captionIcon} size={14} color={colors.white} />
                <Text variant="labelMd" color={colors.white}>
                  {r.caption}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}

      <View style={styles.dual}>
        <View style={styles.dualIcon}>
          <Icon name="sync_alt" size={20} color={colors.navy} />
        </View>
        <Text variant="body" color={colors.muted} style={styles.flex}>
          Dual role? You can link your shop, showroom or contractor crew later from Profile settings.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceHigh },
  stepDone: { backgroundColor: colors.goldInk },
  head: { gap: 8 },
  card: { gap: space.md, padding: space.lg, borderRadius: radius.hero, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.card },
  cardActive: { borderColor: colors.gold, ...shadows.raised },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  roleIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.navyInk },
  point: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  image: { height: 120, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end' },
  caption: { flexDirection: 'row', alignItems: 'center', gap: 6, margin: space.md, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: 'rgba(11,30,61,0.6)' },
  dual: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surfaceLow },
  dualIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  footer: { gap: space.sm, paddingBottom: space.sm },
  member: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
});
