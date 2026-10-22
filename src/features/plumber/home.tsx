import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { $api } from '@/api/client';
import { DOCK_HEIGHT } from '@/components/tab-dock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, HeroCard } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Screen, SectionTitle } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import {Empty, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { firstName, formatDate, formatINR, formatNumber, formatRelative } from '@/lib/format';
import { plumberTier } from '@/lib/tier';
import { colors, radius, space } from '@/theme/tokens';
import { ActivityRow, HomeTopBar, initialsOf, ManagerCard, QuickActions } from '../shared/parts';
import { PlumberHomeSkeleton } from '@/components/skeletons';

type Feed = 'all' | 'scans' | 'redeemed';

export function PlumberHome() {
  const router = useRouter();
  const [feed, setFeed] = useState<Feed>('all');
  const me = $api.useQuery('get', '/api/v1/app/plumbers/me');
  const pending = $api.useQuery('get', '/api/v1/app/scans', { params: { query: { status: 'Pending', pageSize: 100 } } });
  const scans = $api.useQuery('get', '/api/v1/app/scans', { params: { query: { pageSize: 5 } } });
  const redemptions = $api.useQuery('get', '/api/v1/app/redemptions', { params: { query: { pageSize: 5 } } });
  const schemes = $api.useQuery('get', '/api/v1/app/schemes');
  const rewards = $api.useQuery('get', '/api/v1/app/rewards', { params: { query: { pageSize: 50 } } });

  const refetchAll = () => Promise.all([me.refetch(), pending.refetch(), scans.refetch(), redemptions.refetch(), schemes.refetch(), rewards.refetch()]);
  const loadError: unknown = me.error;

  if (me.isLoading)
    return (
      <View style={styles.flex}>
        <HomeTopBar title="Home" initials="" />
        <Screen bottomInset={DOCK_HEIGHT}>
          <PlumberHomeSkeleton />
        </Screen>
      </View>
    );
  if (loadError || !me.data) return <ErrorState error={loadError} onRetry={() => void me.refetch()} />;

  const p = me.data;
  const tier = plumberTier(p.points.lifetime);
  const pendingPoints = (pending.data?.items ?? []).reduce((sum, s) => sum + s.points, 0);
  const goal = (rewards.data?.items ?? []).filter((r) => r.pointsShort > 0 && r.inStock).sort((a, b) => a.pointsRequired - b.pointsRequired)[0];
  const offer = (schemes.data ?? []).find((s) => s.status === 'Active');

  const activity = [
    ...(feed !== 'redeemed' ? (scans.data?.items ?? []).map((s) => ({ kind: 'scan' as const, at: s.scannedAt, s })) : []),
    ...(feed !== 'scans' ? (redemptions.data?.items ?? []).map((r) => ({ kind: 'redemption' as const, at: r.requestedAt, r })) : []),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5);

  return (
    <View style={styles.flex}>
      <HomeTopBar title="Home" initials={initialsOf(p.name)} photoUrl={p.photoUrl} />
      <Screen onRefresh={() => void refetchAll()} refreshing={me.isRefetching} bottomInset={DOCK_HEIGHT}>
        <View style={styles.greeting}>
          {/* Greeting gets the full width; the verified mark sits right after the name (wraps with it). */}
          <View style={styles.nameRow}>
            <Text variant="headlineXl" color={colors.inkStrong} style={styles.name}>
              Namaste, {firstName(p.name)}!
            </Text>
            {p.verificationStatus === 'Verified' ? (
              <View style={styles.verified} accessibilityLabel="KYC verified">
                <Icon name="verified" size={20} color={colors.emerald} />
              </View>
            ) : null}
          </View>
          <View style={styles.idRow}>
            <Text variant="body" color={colors.muted} style={styles.name}>
              Master Plumber ID: <Text variant="labelLg" color={colors.inkStrong}>#{p.id}</Text>
            </Text>
            <View style={styles.tierBadge}>
              <Badge label={tier.name} tone="gold" icon="military_tech" />
            </View>
          </View>
        </View>

        {p.verificationStatus !== 'Verified' ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/kyc')} style={styles.kycBanner}>
            <Icon name="fingerprint" size={22} color={colors.warning} />
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.inkStrong}>
                {p.verificationStatus === 'Rejected' ? 'KYC rejected — verify again' : 'Complete Aadhaar KYC'}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                Scans are credited only after your identity is verified.
              </Text>
            </View>
            <Icon name="chevron_right" color={colors.slate} />
          </Pressable>
        ) : null}

        <HeroCard>
          <View style={styles.heroTop}>
            <View>
              <Text variant="labelSm" color={colors.goldLight}>
                Available balance
              </Text>
              <View style={styles.balance}>
                <Text variant="display" color={colors.white} style={styles.tabular}>
                  {formatNumber(p.points.available)}
                </Text>
                <Text variant="labelLg" color={colors.goldLight}>
                  PTS
                </Text>
              </View>
            </View>
            <View style={styles.right}>
              <Text variant="labelSm" color={colors.onNavyMuted}>
                Estimated value
              </Text>
              <Text variant="headlineMd" color={colors.white}>
                {formatINR(p.points.available)}*
              </Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <View style={[styles.dot, { backgroundColor: colors.goldLight }]} />
              <View>
                <Text variant="bodySm" color={colors.onNavyMuted}>
                  Pending approval
                </Text>
                <Text variant="labelLg" color={colors.white}>
                  {formatNumber(pendingPoints)} pts
                </Text>
              </View>
            </View>
            <View style={styles.heroStat}>
              <View style={[styles.dot, { backgroundColor: colors.emerald }]} />
              <View>
                <Text variant="bodySm" color={colors.onNavyMuted}>
                  Lifetime earned
                </Text>
                <Text variant="labelLg" color={colors.white}>
                  {formatNumber(p.points.lifetime)} pts
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.heroActions}>
            <Button title="Scan Code" icon="qr_code_scanner" variant="gold" size="md" style={styles.flex} onPress={() => router.push('/scan')} />
            <Pressable accessibilityRole="button" onPress={() => router.push('/rewards')} style={styles.ghost}>
              <Icon name="redeem" color={colors.white} />
              <Text variant="labelLg" color={colors.white}>
                Redeem Gifts
              </Text>
            </Pressable>
          </View>
        </HeroCard>

        {goal ? (
          <Card style={styles.gap}>
            <View style={styles.goalHead}>
              <View style={styles.goalIcon}>
                <Icon name="featured_seasonal_and_gifts" size={24} color={colors.goldInk} />
              </View>
              <View style={styles.flex}>
                <Text variant="labelSm" color={colors.goldInk}>
                  Target milestone
                </Text>
                <Text variant="headlineSm" color={colors.inkStrong} numberOfLines={1}>
                  {goal.name}
                </Text>
                <Text variant="bodySm" color={colors.muted}>
                  {formatNumber(goal.pointsRequired)} pts target tier
                </Text>
              </View>
              <Badge label={`${Math.round((p.points.available / goal.pointsRequired) * 100)}%`} tone="gold" />
            </View>
            <Progress value={(p.points.available / goal.pointsRequired) * 100} />
            <View style={styles.goalFoot}>
              <Text variant="labelMd" color={colors.slate}>
                {formatNumber(p.points.available)} pts
              </Text>
              <Text variant="labelMd" color={colors.goldInk}>
                {formatNumber(goal.pointsShort)} pts to unlock
              </Text>
              <Text variant="labelMd" color={colors.slate}>
                {formatNumber(goal.pointsRequired)} pts
              </Text>
            </View>
          </Card>
        ) : null}

        <QuickActions
          items={[
            { icon: 'qr_code_2', label: 'Scan Box', href: '/scan' },
            { icon: 'storefront', label: 'Rewards Store', href: '/rewards' },
            { icon: 'pin_drop', label: 'Nearby Dealers', href: { pathname: '/explore', params: { view: 'dealers' } } },
            { icon: 'account_balance_wallet', label: 'Passbook', href: '/history' },
          ]}
        />

        {offer ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/explore')} style={styles.offer}>
            <View style={styles.offerIcon}>
              <Icon name="electric_bolt" size={26} color={colors.navy} />
            </View>
            <View style={styles.flex}>
              <View style={styles.offerBadges}>
                <Badge label="Active offer" tone="gold" />
                <Text variant="labelMd" color={colors.goldLight}>
                  Valid till {formatDate(offer.endDate)}
                </Text>
              </View>
              <Text variant="headlineSm" color={colors.white}>
                {offer.name}
              </Text>
              <Text variant="bodySm" color={colors.onNavyMuted} numberOfLines={2}>
                {offer.description}
              </Text>
              <View style={styles.offerProgress}>
                <Progress value={offer.percent} track="rgba(255,255,255,0.15)" />
                <Text variant="labelSm" color={colors.goldLight} style={styles.offerPct}>
                  {offer.awarded ? 'Achieved' : `${offer.progress} / ${offer.targetValue} scans · +${formatNumber(offer.incentivePoints)} pts`}
                </Text>
              </View>
            </View>
            <Icon name="chevron_right" color={colors.white} />
          </Pressable>
        ) : null}

        <Card style={styles.gap}>
          <SectionTitle title="Verification Activity" action="View all" onAction={() => router.push('/history')} />
          <Segmented
            value={feed}
            onChange={setFeed}
            options={[
              { value: 'all', label: 'All' },
              { value: 'scans', label: 'Scans' },
              { value: 'redeemed', label: 'Redeemed' },
            ]}
          />
          {activity.length === 0 ? (
            <Empty icon="qr_code_scanner" title="No activity yet" detail="Scan the QR label on a Levik product to earn your first points." />
          ) : (
            activity.map((a) =>
              a.kind === 'scan' ? (
                <ActivityRow
                  key={a.s.id}
                  icon={a.s.status === 'Approved' ? 'check_circle' : a.s.status === 'Rejected' ? 'cancel' : 'hourglass_top'}
                  tone={a.s.status === 'Approved' ? 'emerald' : a.s.status === 'Rejected' ? 'error' : 'gold'}
                  title={a.s.productName}
                  subtitle={`${a.s.serial} • ${formatRelative(a.s.scannedAt)}`}
                  amount={a.s.status === 'Rejected' ? '0 Pts' : `+${formatNumber(a.s.points)} Pts`}
                  amountTone={a.s.status === 'Rejected' ? 'navy' : 'emerald'}
                  caption={a.s.status === 'Approved' ? 'Verified' : a.s.status === 'Rejected' ? 'Rejected' : a.s.awaitingRetailer ? 'Dealer to confirm' : 'In Review'}
                />
              ) : (
                <ActivityRow
                  key={a.r.id}
                  icon="shopping_bag"
                  tone="navy"
                  title={a.r.rewardName}
                  subtitle={`Ref: ${a.r.id} • ${formatRelative(a.r.requestedAt)}`}
                  amount={`−${formatNumber(a.r.pointsCost)} Pts`}
                  amountTone="error"
                  caption={a.r.status}
                  onPress={() => router.push('/redemptions')}
                />
              ),
            )
          )}
        </Card>

        <ManagerCard />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  tabular: { fontVariant: ['tabular-nums'] },
  greeting: { gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1 },
  verified: { flexShrink: 0 },
  idRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  tierBadge: { flexShrink: 0 },
  kycBanner: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.warningWash },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between' },
  balance: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  right: { alignItems: 'flex-end' },
  heroStats: { flexDirection: 'row', gap: space.lg, marginTop: space.lg, padding: space.md, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroStat: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  heroActions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  ghost: { flex: 1, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.card, backgroundColor: 'rgba(255,255,255,0.1)' },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  goalIcon: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.goldWash, alignItems: 'center', justifyContent: 'center' },
  goalFoot: { flexDirection: 'row', justifyContent: 'space-between' },
  offer: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.hero, backgroundColor: colors.navyRaised },
  offerIcon: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  offerBadges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  offerProgress: { marginTop: space.sm, gap: 4 },
  offerPct: { textTransform: 'none' },
});

