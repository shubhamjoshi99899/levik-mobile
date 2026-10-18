import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { colors, gradients, radius, shadows, space } from '@/theme/tokens';

const BENEFITS = [
  { icon: 'qr_code_scanner', title: 'Earn Instant Rewards', tag: 'Fast points', tone: 'emerald' as const, text: 'Scan tamper-evident QR codes on eligible Levik western closets, basins & fixtures to accumulate points immediately.' },
  { icon: 'featured_seasonal_and_gifts', title: 'Milestone Gifts & Perks', tag: 'Premium', tone: 'gold' as const, text: 'Unlock premium appliances, power tools and instant digital shopping vouchers at every tier.' },
  { icon: 'hub', title: 'Direct Brand Connect', tag: 'Official', tone: 'neutral' as const, text: 'Access seasonal trade schemes, digital warranty certificates and authentic registered distributors.' },
];

export default function Welcome() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'hi' | 'gu'>('en');
  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/sign-in')} style={styles.cta}>
            <View style={styles.lock}>
              <Icon name="lock_open" size={18} color={colors.goldLight} />
            </View>
            <Text variant="headlineSm" color={colors.white} style={styles.ctaTitle}>
              Get Started
            </Text>
            <Text variant="labelLg" color={colors.goldLight}>
              JOIN SCHEME
            </Text>
            <Icon name="arrow_forward" size={18} color={colors.goldLight} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/sign-in')} style={styles.login}>
            <Text variant="labelLg" color={colors.navy}>
              Already registered? Log in
            </Text>
          </Pressable>
          <Text variant="bodySm" color={colors.muted} style={styles.terms}>
            By proceeding, you confirm you are an authorised plumber, dealer or trade partner and agree to the Terms of Trade Scheme & Privacy Charter.
          </Text>
        </View>
      }
    >
      <View style={styles.topRow}>
        <Badge label="Verified trade guild" tone="neutral" icon="verified" />
        <View style={styles.lang}>
          <Segmented
            value={lang}
            onChange={setLang}
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'हिन्दी' },
              { value: 'gu', label: 'ગુજરાતી' },
            ]}
          />
        </View>
      </View>

      <View style={styles.hero}>
        <Image source={require('@/assets/images/brand-cover.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />
        <LinearGradient colors={gradients.navyHero} style={StyleSheet.absoluteFill} />
        <Badge label="Trade loyalty app" tone="gold" icon="workspace_premium" />
        <View style={styles.heroText}>
          <View style={styles.eyebrow}>
            <View style={styles.rule} />
            <Text variant="labelSm" color={colors.goldLight}>
              Levik Luxury
            </Text>
          </View>
          <Text variant="headlineXl" color={colors.white}>
            LEVIK ARCHITECTURAL
          </Text>
          <Text variant="bodyLg" color={colors.onNavyMuted}>
            Built on Trust. Rewarded with Levik.
          </Text>
        </View>
      </View>

      <View>
        <Text variant="labelSm" color={colors.goldInk}>
          Welcome aboard
        </Text>
        <Text variant="headlineLg" color={colors.inkStrong}>
          Exclusive Trade Benefits
        </Text>
      </View>

      {BENEFITS.map((b, i) => (
        <Card key={b.title} style={styles.benefit}>
          <View style={[styles.benefitIcon, i === 1 && { backgroundColor: colors.goldSoft }]}>
            <Icon name={b.icon} color={i === 1 ? colors.goldInk : colors.navy} />
          </View>
          <View style={styles.benefitBody}>
            <View style={styles.benefitTitle}>
              <Text variant="headlineSm" color={colors.inkStrong} style={styles.flex} numberOfLines={1}>
                {b.title}
              </Text>
              <Badge label={b.tag} tone={b.tone} />
            </View>
            <Text variant="body" color={colors.muted}>
              {b.text}
            </Text>
          </View>
        </Card>
      ))}

      <View style={styles.strip}>
        {[
          ['description', '100% Genuine SKUs'],
          ['bolt', 'Instant UPI Cashout'],
          ['support_agent', 'VIP Desk'],
        ].map(([icon, label]) => (
          <View key={label} style={styles.stripItem}>
            <Icon name={icon} size={16} color={colors.goldInk} />
            <Text variant="labelMd" color={colors.slate}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  lang: { flex: 1, maxWidth: 230 },
  hero: { height: 300, borderRadius: radius.hero, overflow: 'hidden', padding: space.xl, justifyContent: 'space-between', backgroundColor: colors.navy, ...shadows.raised },
  heroText: { gap: 6 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rule: { width: 24, height: 2, backgroundColor: colors.goldLight },
  benefit: { flexDirection: 'row', gap: space.lg },
  benefitIcon: { width: 56, height: 56, borderRadius: radius.lg, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' },
  benefitBody: { flex: 1, gap: 4 },
  benefitTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  strip: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surfaceLow },
  stripItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footer: { gap: space.sm, paddingBottom: space.sm },
  cta: { flexDirection: 'row', alignItems: 'center', gap: space.md, height: 64, paddingHorizontal: space.lg, borderRadius: radius.card, backgroundColor: colors.navy, ...shadows.raised },
  lock: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  ctaTitle: { flex: 1 },
  login: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.card, backgroundColor: colors.surfaceMid },
  terms: { textAlign: 'center', paddingHorizontal: space.sm },
});
