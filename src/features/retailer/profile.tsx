import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';
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
import { retailerTier } from '@/lib/tier';
import { TERRITORY_MANAGER } from '@/mocks';
import { colors, radius, space } from '@/theme/tokens';
import { Menu } from '../shared/menu';
import { ProfileSkeleton } from '@/components/skeletons';

export function RetailerProfile() {
  const router = useRouter();
  const me = $api.useQuery('get', '/api/v1/app/retailers/me');
  const schemes = $api.useQuery('get', '/api/v1/app/schemes');
  const loadError: unknown = me.error;
  if (me.isLoading)
    return (
      <Screen header={<AppHeader back eyebrow="Levik Luxury" title="Profile Account" />}>
        <ProfileSkeleton />
      </Screen>
    );
  if (loadError || !me.data) return <ErrorState error={loadError} onRetry={() => void me.refetch()} />;

  const r = me.data;
  const tier = retailerTier(r.achievementPct);
  const live = (schemes.data ?? []).filter((s) => s.status === 'Active').length;
  const call = (phone: string) => void Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);

  return (
    <Screen header={<AppHeader back eyebrow="Levik Luxury" title="Profile Account" right={<Badge label="EN" tone="neutral" icon="translate" />} />} onRefresh={() => void me.refetch()} refreshing={me.isRefetching}>
      <Card style={styles.gap}>
        <View style={styles.row}>
          <View style={styles.shopIcon}>
            <Icon name="storefront" size={30} color={colors.goldLight} />
          </View>
          <View style={styles.flex}>
            <View style={styles.wrap}>
              <Badge label={tier.name} tone="gold" icon="diamond" uppercase={false} />
              <Badge label={r.verificationStatus === 'Approved' ? 'KYC & GSTIN' : r.verificationStatus} tone={r.verificationStatus === 'Approved' ? 'emerald' : 'warning'} icon="verified" uppercase={false} />
            </View>
            <Text variant="headlineMd" color={colors.inkStrong}>
              {r.shopName}
            </Text>
            <Text variant="bodySm" color={colors.muted}>
              {r.ownerName} (Proprietor) • #{r.id}
            </Text>
          </View>
        </View>
        <View style={styles.line}>
          <Icon name="pin_drop" size={18} color={colors.slate} />
          <Text variant="body" color={colors.ink} style={styles.flex}>
            {r.address}, {r.city}, {r.state}
          </Text>
        </View>
        <View style={styles.line}>
          <Icon name="call" size={18} color={colors.slate} />
          <Text variant="body" color={colors.ink} style={styles.flex}>
            {maskMobile(r.mobile)}
          </Text>
        </View>
        {r.gstin ? (
          <View style={styles.gstin}>
            <Text variant="labelMd" color={colors.slate}>
              GSTIN:
            </Text>
            <Text variant="labelLg" color={colors.inkStrong} style={styles.flex}>
              {r.gstin}
            </Text>
            <Icon name="check_circle" size={18} color={colors.emerald} />
          </View>
        ) : null}
      </Card>

      <HeroCard style={styles.gap}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Icon name="query_stats" color={colors.goldLight} />
            <Text variant="labelSm" color={colors.white}>
              Commercial target
            </Text>
          </View>
          <Badge label={`${r.achievementPct}% achieved`} tone="gold" uppercase={false} />
        </View>
        <Text variant="labelSm" color={colors.onNavyMuted}>
          Sales achievement (30 days)
        </Text>
        <Text variant="headlineXl" color={colors.white}>
          {formatINR(r.sales30d)} <Text variant="bodyLg" color={colors.onNavyMuted}>/ {formatINR(r.monthlyTarget)}</Text>
        </Text>
        <Progress value={r.achievementPct} track="rgba(255,255,255,0.15)" />
        <View style={styles.row}>
          <View style={styles.tile}>
            <Text variant="labelSm" color={colors.onNavyMuted}>
              Points reserve
            </Text>
            <Text variant="headlineSm" color={colors.white}>
              {formatNumber(r.points.available)}
            </Text>
            <Text variant="bodySm" color={colors.goldLight}>
              Redeemable
            </Text>
          </View>
          <View style={styles.tile}>
            <Text variant="labelSm" color={colors.onNavyMuted}>
              Active schemes
            </Text>
            <Text variant="headlineSm" color={colors.white}>
              {live} Active
            </Text>
            <Text variant="bodySm" color={colors.goldLight}>
              Retailer targets
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Button title="Ledger" icon="receipt_long" variant="soft" size="md" style={styles.flex} onPress={() => router.push('/history')} />
          <Button title="Upload Invoice" icon="upload_file" variant="gold" size="md" style={styles.flex} onPress={() => router.push('/invoice-upload')} />
        </View>
      </HeroCard>

      <Card style={styles.gap}>
        <Text variant="headlineSm" color={colors.inkStrong}>
          Territory & Key Contact
        </Text>
        <View style={styles.manager}>
          <View style={styles.flex}>
            <Text variant="labelSm" color={colors.slate}>
              Territory manager · {TERRITORY_MANAGER.zone}
            </Text>
            <Text variant="labelLg" color={colors.inkStrong}>
              {TERRITORY_MANAGER.name}
            </Text>
            <Text variant="bodySm" color={colors.muted}>
              {TERRITORY_MANAGER.phone}
            </Text>
          </View>
          <Button title="Call" icon="call" size="sm" onPress={() => call(TERRITORY_MANAGER.phone)} />
        </View>
        {r.distributor ? (
          <View style={styles.line}>
            <Icon name="warehouse" size={20} color={colors.slate} />
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.inkStrong}>
                {r.distributor}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                Distributor · direct billing fulfilment
              </Text>
            </View>
          </View>
        ) : null}
      </Card>

      <Menu
        title="DEALER OPERATIONS & ACCOUNTS"
        items={[
          { icon: 'explore', title: 'Explore Products & Dealers', detail: 'Catalogue, incentives and dealer stock', onPress: () => router.push('/explore') },
          { icon: 'redeem', title: 'My Redemptions', detail: 'Reward requests and delivery', onPress: () => router.push('/redemptions') },
          { icon: 'badge', title: 'Store Staff & Counter Sales', detail: 'Counter staff scan logins' },
          { icon: 'receipt', title: 'Tax Invoices & Credit Notes', detail: 'Monthly GSTR-2B settlement archives' },
          { icon: 'menu_book', title: 'Master Margin & Price Catalogue', detail: 'Confidential trade discount schedules' },
        ]}
      />

      <Button title="Log Out of Partner App" icon="logout" variant="outline" onPress={() => void signOut().then(() => queryClient.clear())} />
      <Text variant="bodySm" color={colors.faint} style={styles.version}>
        Levik Partner App • v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  shopIcon: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  gstin: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  tile: { flex: 1, gap: 2, padding: space.md, borderRadius: radius.lg, backgroundColor: 'rgba(0,0,0,0.2)' },
  manager: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  version: { textAlign: 'center' },
});
