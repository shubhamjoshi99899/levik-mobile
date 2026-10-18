import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { $api, queryClient } from '@/api/client';
import { signOut } from '@/api/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, HeroCard } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { AppHeader, Screen } from '@/components/ui/screen';
import {ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { formatINR, formatNumber, maskMobile } from '@/lib/format';
import { plumberTier } from '@/lib/tier';
import { PAYOUT_ACCOUNTS, TERRITORY_MANAGER } from '@/mocks';
import { colors, radius, space } from '@/theme/tokens';
import { Menu } from '../shared/menu';
import { initialsOf } from '../shared/parts';
import { ProfileSkeleton } from '@/components/skeletons';

export function PlumberProfile() {
  const router = useRouter();
  const me = $api.useQuery('get', '/api/v1/app/plumbers/me');
  const loadError: unknown = me.error;
  if (me.isLoading)
    return (
      <Screen header={<AppHeader back eyebrow="Levik Luxury" title="Profile Account" />}>
        <ProfileSkeleton />
      </Screen>
    );
  if (loadError || !me.data) return <ErrorState error={loadError} onRetry={() => void me.refetch()} />;

  const p = me.data;
  const tier = plumberTier(p.points.lifetime);
  const verified = p.verificationStatus === 'Verified';
  const readiness = [verified, Boolean(p.preferredRetailer), Boolean(p.email), p.experienceYears > 0].filter(Boolean).length * 25;

  const logout = async () => {
    await signOut();
    queryClient.clear();
  };

  return (
    <Screen header={<AppHeader back eyebrow="Levik Luxury" title="Profile Account" right={<Badge label="EN" tone="neutral" icon="translate" />} />} onRefresh={() => void me.refetch()} refreshing={me.isRefetching}>
      <Card style={styles.gap}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text variant="headlineLg" color={colors.goldLight}>
              {initialsOf(p.name)}
            </Text>
            {verified ? (
              <View style={styles.avatarBadge}>
                <Icon name="verified" size={14} color={colors.white} />
              </View>
            ) : null}
          </View>
          <View style={styles.flex}>
            <View style={styles.row}>
              <Badge label="Master plumber" tone="gold" icon="military_tech" />
              <Badge label={`#${p.id}`} tone="neutral" uppercase={false} />
            </View>
            <Text variant="headlineMd" color={colors.inkStrong}>
              {p.name}
            </Text>
            <Text variant="bodySm" color={colors.muted}>
              {maskMobile(p.mobile)} • {p.city}, {p.state}
            </Text>
          </View>
        </View>
        <View style={styles.readiness}>
          <View style={styles.rowBetween}>
            <Text variant="labelMd" color={colors.slate}>
              Profile readiness
            </Text>
            <Text variant="labelMd" color={colors.inkStrong}>
              {readiness}%
            </Text>
          </View>
          <Progress value={readiness} />
          {!verified ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/kyc')} style={styles.rowBetween}>
              <Text variant="bodySm" color={colors.muted}>
                Complete Aadhaar KYC to get scans credited
              </Text>
              <Text variant="labelMd" color={colors.goldInk}>
                Fix now ›
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Card>

      <HeroCard style={styles.gap}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Icon name="stars" size={18} color={colors.goldLight} />
            <Text variant="labelSm" color={colors.white}>
              Levik trade wallet
            </Text>
          </View>
          <Badge label={`${tier.name} (${tier.multiplier})`} tone="gold" uppercase={false} />
        </View>
        <View style={styles.row}>
          <View style={styles.walletTile}>
            <Text variant="labelSm" color={colors.onNavyMuted}>
              Available balance
            </Text>
            <Text variant="headlineXl" color={colors.white}>
              {formatNumber(p.points.available)}
            </Text>
            <Text variant="bodySm" color={colors.onNavyMuted}>
              ≈ {formatINR(p.points.available)} cash value
            </Text>
          </View>
          <View style={styles.walletTile}>
            <Text variant="labelSm" color={colors.onNavyMuted}>
              Lifetime scans
            </Text>
            <Text variant="headlineXl" color={colors.white}>
              {formatNumber(p.scanCounts.approved)}
            </Text>
            <Text variant="bodySm" color={colors.onNavyMuted}>
              {formatNumber(p.points.lifetime)} pts earned
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Button title="Passbook" icon="receipt_long" variant="soft" size="md" style={styles.flex} onPress={() => router.push('/history')} />
          <Button title="Redeem Gift" icon="redeem" variant="gold" size="md" style={styles.flex} onPress={() => router.push('/rewards')} />
        </View>
      </HeroCard>

      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <Text variant="headlineSm" color={colors.inkStrong}>
            KYC & Trade Compliance
          </Text>
          <Icon name="verified_user" color={verified ? colors.emerald : colors.faint} />
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/kyc')} style={styles.kycRow}>
          <View style={styles.kycIcon}>
            <Icon name="fingerprint" color={colors.navy} />
          </View>
          <View style={styles.flex}>
            <View style={styles.row}>
              <Text variant="labelLg" color={colors.inkStrong}>
                UIDAI Aadhaar
              </Text>
              <Badge label={p.verificationStatus} tone={verified ? 'emerald' : p.verificationStatus === 'Rejected' ? 'error' : 'warning'} />
            </View>
            <Text variant="bodySm" color={colors.muted}>
              {p.aadhaarMasked ?? 'Not submitted'}
            </Text>
          </View>
          <Icon name={verified ? 'check_circle' : 'chevron_right'} color={verified ? colors.emerald : colors.faint} />
        </Pressable>
        <View style={styles.kycRow}>
          <View style={styles.kycIcon}>
            <Icon name="storefront" color={colors.navy} />
          </View>
          <View style={styles.flex}>
            <Text variant="labelSm" color={colors.slate}>
              Associated dealer counter
            </Text>
            <Text variant="labelLg" color={colors.inkStrong}>
              {p.preferredRetailer?.shopName ?? 'No dealer selected'}
            </Text>
            {p.preferredRetailer ? (
              <Text variant="bodySm" color={colors.muted}>
                Dealer code: #{p.preferredRetailer.id}
              </Text>
            ) : null}
          </View>
          <Button title="Dealers" size="sm" variant="outline" onPress={() => router.push({ pathname: '/explore', params: { view: 'dealers' } })} />
        </View>
      </Card>

      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Text variant="headlineSm" color={colors.inkStrong}>
              Direct Payout Account
            </Text>
            <Text variant="bodySm" color={colors.muted}>
              Instant rewards direct to your savings account
            </Text>
          </View>
          <Badge label="Preview" tone="neutral" uppercase={false} />
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/cashout')} style={styles.payout}>
          <View style={styles.rupee}>
            <Text variant="headlineSm" color={colors.goldLight}>
              ₹
            </Text>
          </View>
          <View style={styles.flex}>
            <Text variant="labelLg" color={colors.inkStrong}>
              {PAYOUT_ACCOUNTS[1].detail}
            </Text>
            <Text variant="bodySm" color={colors.muted}>
              @ {PAYOUT_ACCOUNTS[0].detail}
            </Text>
          </View>
          <Text variant="labelMd" color={colors.goldInk}>
            Manage
          </Text>
        </Pressable>
      </Card>

      <Menu
        title="TRADE & OPERATIONS"
        items={[
          { icon: 'explore', title: 'Explore Products & Dealers', detail: 'Where to buy and what each model earns', onPress: () => router.push('/explore') },
          { icon: 'redeem', title: 'My Redemptions', detail: 'Reward requests and delivery', onPress: () => router.push('/redemptions') },
          { icon: 'group', title: 'My Work Crew & Helpers', detail: 'Registered assistants' },
          { icon: 'workspace_premium', title: 'Customer Warranty Cards', detail: 'Digital guarantee issuances' },
          { icon: 'translate', title: 'App Language', detail: 'हिन्दी / English', value: 'English' },
          { icon: 'notifications_active', title: 'Notification Alerts', detail: 'WhatsApp scan receipts & SMS' },
          {
            icon: 'support_agent',
            title: 'Dedicated Relationship Manager',
            detail: `${TERRITORY_MANAGER.name} (Area Mgr): ${TERRITORY_MANAGER.phone}`,
            highlight: true,
            onPress: () => void Linking.openURL(`tel:${TERRITORY_MANAGER.phone.replace(/\s/g, '')}`),
          },
        ]}
      />

      <Button title="Log Out of Partner App" icon="logout" variant="outline" onPress={() => void logout()} />
      <Text variant="bodySm" color={colors.faint} style={styles.version}>
        Levik Partner App • v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  identity: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.goldLight },
  avatarBadge: { position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.emerald, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface },
  readiness: { gap: space.sm, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  walletTile: { flex: 1, gap: 2, padding: space.md, borderRadius: radius.lg, backgroundColor: 'rgba(0,0,0,0.2)' },
  kycRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  kycIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  payout: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  rupee: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  version: { textAlign: 'center' },
});
