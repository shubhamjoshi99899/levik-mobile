import { keepPreviousData } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { $api, api, call, refreshAll } from '@/api/client';
import { errorMessage } from '@/api/errors';
import type { components } from '@/api/schema';
import { useSession } from '@/api/session';
import { DOCK_HEIGHT } from '@/components/tab-dock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, HeroCard } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { Chips } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Empty, ErrorState, Loading } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { formatNumber } from '@/lib/format';
import { plumberTier } from '@/lib/tier';
import { colors, radius, space } from '@/theme/tokens';
import { HomeTopBar, initialsOf } from './parts';

type Reward = components['schemas']['AppRewardResponseDto'];
type Category = Reward['category'];

const CATEGORY_ICON: Record<string, string> = {
  'Shopping Voucher': 'redeem',
  'Gift Card': 'card_giftcard',
  'Air Conditioner': 'ac_unit',
  Refrigerator: 'kitchen',
  Television: 'tv',
  'Home Appliance': 'kitchen',
  'Tools & Equipment': 'home_repair_service',
  Other: 'workspace_premium',
};

export function RewardsScreen() {
  const router = useRouter();
  const session = useSession();
  const name = session.status === 'signedIn' ? session.user.name : undefined;
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [selected, setSelected] = useState<Reward | null>(null);
  const wallet = $api.useQuery('get', '/api/v1/app/wallet');
  const all = $api.useQuery('get', '/api/v1/app/rewards', { params: { query: { pageSize: 100 } } });
  const list = $api.useQuery(
    'get',
    '/api/v1/app/rewards',
    { params: { query: { pageSize: 100, category: category === 'all' ? undefined : category } } },
    { placeholderData: keepPreviousData },
  );

  const loadError: unknown = wallet.error ?? all.error;
  if (wallet.isLoading || all.isLoading) return <Loading />;
  if (loadError || !wallet.data) return <ErrorState error={loadError} onRetry={() => void Promise.all([wallet.refetch(), all.refetch()])} />;

  const balance = wallet.data.available;
  const tier = plumberTier(wallet.data.lifetime);
  const rewards = all.data?.items ?? [];
  const counts = rewards.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.category]: (acc[r.category] ?? 0) + 1 }), {});
  const dream = [...rewards].filter((r) => r.pointsShort > 0).sort((a, b) => b.pointsRequired - a.pointsRequired)[0];
  const items = (list.data?.items ?? []).filter((r) => r.id !== dream?.id || category !== 'all');

  return (
    <View style={styles.flex}>
      <HomeTopBar title="Rewards" initials={initialsOf(name)} />
      <Screen bottomInset={DOCK_HEIGHT} onRefresh={() => void refreshAll()} refreshing={list.isRefetching}>
        <HeroCard style={styles.hero}>
          <View style={styles.flex}>
            <View style={styles.row}>
              <Icon name="monetization_on" size={18} color={colors.goldLight} />
              <Text variant="labelSm" color={colors.goldLight}>
                Available balance
              </Text>
            </View>
            <View style={styles.balance}>
              <Text variant="headlineXl" color={colors.white} style={styles.tabular}>
                {formatNumber(balance)}
              </Text>
              <Text variant="labelLg" color={colors.goldLight}>
                PTS
              </Text>
            </View>
            <Text variant="bodySm" color={colors.onNavyMuted}>
              {tier.name}: {tier.multiplier} points boost active
            </Text>
          </View>
          <View style={styles.heroRight}>
            <Badge label={tier.name} tone="soft" icon="auto_graph" uppercase={false} />
            <Pressable accessibilityRole="button" onPress={() => router.push('/redemptions')} style={styles.row}>
              <Text variant="labelMd" color={colors.goldLight}>
                My requests
              </Text>
              <Icon name="chevron_right" size={16} color={colors.goldLight} />
            </Pressable>
          </View>
        </HeroCard>

        <Chips
          value={category}
          onChange={setCategory}
          options={[
            { value: 'all' as const, label: 'All Gifts', count: rewards.length },
            ...(Object.keys(counts) as Category[]).map((c) => ({ value: c, label: c, count: counts[c] })),
          ]}
        />

        {dream && category === 'all' ? (
          <Card style={styles.gap}>
            <View style={styles.rowBetween}>
              <Badge label="Dream reward goal" tone="gold" icon="hotel_class" />
              <Badge label="Locked" tone="error" icon="lock" uppercase={false} />
            </View>
            <View style={styles.dream}>
              <View style={styles.dreamIcon}>
                <Icon name={CATEGORY_ICON[dream.category] ?? 'redeem'} size={44} color={colors.goldLight} />
              </View>
              <View style={styles.flex}>
                <Text variant="labelSm" color={colors.goldInk}>
                  Levik luxury series
                </Text>
                <Text variant="headlineSm" color={colors.inkStrong}>
                  {dream.name}
                </Text>
                <Text variant="headlineMd" color={colors.goldInk}>
                  {formatNumber(dream.pointsRequired)} <Text variant="labelMd" color={colors.goldInk}>PTS</Text>
                </Text>
              </View>
            </View>
            <View style={styles.rowBetween}>
              <Text variant="bodySm" color={colors.muted}>
                Progress ({formatNumber(balance)} / {formatNumber(dream.pointsRequired)})
              </Text>
              <Text variant="labelMd" color={colors.goldInk}>
                {formatNumber(dream.pointsShort)} pts needed
              </Text>
            </View>
            <Progress value={(balance / dream.pointsRequired) * 100} />
          </Card>
        ) : null}

        <View>
          <Text variant="headlineMd" color={colors.inkStrong}>
            Curated Marketplace
          </Text>
          <Text variant="bodySm" color={colors.muted}>
            Instant vouchers & fast-dispatch contractor perks
          </Text>
        </View>

        {items.length === 0 ? <Empty icon="redeem" title="No rewards in this category" /> : null}
        {items.map((r) => {
          const ready = r.pointsShort === 0 && r.inStock;
          return (
            <Card key={r.id} style={styles.gap}>
              {ready ? (
                <View style={styles.ribbon}>
                  <Badge label="Ready to claim" tone="gold" icon="check_circle" uppercase={false} />
                </View>
              ) : null}
              <View style={styles.item}>
                <View style={[styles.itemIcon, ready && { backgroundColor: colors.navy }]}>
                  <Icon name={CATEGORY_ICON[r.category] ?? 'redeem'} size={32} color={ready ? colors.goldLight : colors.navy} />
                </View>
                <View style={styles.flex}>
                  <Text variant="labelSm" color={colors.goldInk}>
                    {r.category}
                  </Text>
                  <Text variant="headlineSm" color={colors.inkStrong} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <View style={styles.row}>
                    <Text variant="headlineMd" color={colors.inkStrong} style={styles.tabular}>
                      {formatNumber(r.pointsRequired)}
                    </Text>
                    <Text variant="labelMd" color={colors.slate}>
                      PTS
                    </Text>
                    {!ready && r.inStock ? <Badge label={`${formatNumber(r.pointsShort)} pts needed`} tone="neutral" uppercase={false} /> : null}
                    {!r.inStock ? <Badge label="Out of stock" tone="error" uppercase={false} /> : null}
                    {ready ? (
                      <Text variant="labelMd" color={colors.emeraldDeep}>
                        {r.type === 'Digital' ? 'Instant SMS code' : 'Free shipping'}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
              {ready ? (
                <View style={styles.rowBetween}>
                  <Text variant="bodySm" color={colors.muted}>
                    Balance remaining: <Text variant="labelMd" color={colors.inkStrong}>{formatNumber(balance - r.pointsRequired)} pts</Text>
                  </Text>
                  <Button title="Redeem Now" trailingIcon="arrow_forward" variant="gold" size="md" onPress={() => setSelected(r)} />
                </View>
              ) : (
                <>
                  <View style={styles.rowBetween}>
                    <Text variant="bodySm" color={colors.muted}>
                      Goal status
                    </Text>
                    <Text variant="labelMd" color={colors.inkStrong}>
                      {Math.min(99, Math.round((balance / r.pointsRequired) * 100))}% achieved
                    </Text>
                  </View>
                  <Progress value={(balance / r.pointsRequired) * 100} tone="navy" />
                </>
              )}
            </Card>
          );
        })}

        <View style={styles.assure}>
          <View style={styles.assureIcon}>
            <Icon name="verified_user" color={colors.goldInk} />
          </View>
          <View style={styles.flex}>
            <Text variant="headlineSm" color={colors.inkStrong}>
              Levik Assurance & Guarantee
            </Text>
            <Text variant="body" color={colors.muted}>
              Points are deducted only when the Levik team approves your request, and refunded if it is cancelled.
            </Text>
          </View>
        </View>
      </Screen>
      <RedeemSheet reward={selected} balance={balance} onClose={() => setSelected(null)} />
    </View>
  );
}

function RedeemSheet({ reward, balance, onClose }: { reward: Reward | null; balance: number; onClose: () => void }) {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const digital = reward?.type === 'Digital';

  const submit = async () => {
    if (!reward) return;
    setBusy(true);
    setError(null);
    try {
      await call(api.POST('/api/v1/app/redemptions', { body: { rewardId: reward.id, deliveryAddress: address.trim() } }));
      void refreshAll();
      setAddress('');
      onClose();
      router.push('/redemptions');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={reward !== null} onClose={onClose} title="Redeem reward">
      {reward ? (
        <>
          <Text variant="headlineSm" color={colors.inkStrong}>
            {reward.name}
          </Text>
          <View style={styles.summary}>
            <View style={styles.rowBetween}>
              <Text variant="body" color={colors.muted}>
                Points required
              </Text>
              <Text variant="labelLg" color={colors.inkStrong}>
                {formatNumber(reward.pointsRequired)} pts
              </Text>
            </View>
            <View style={styles.rowBetween}>
              <Text variant="body" color={colors.muted}>
                Balance after approval
              </Text>
              <Text variant="labelLg" color={colors.emeraldDeep}>
                {formatNumber(balance - reward.pointsRequired)} pts
              </Text>
            </View>
          </View>
          <Field
            label={digital ? 'Send voucher to (mobile or email)' : 'Delivery address'}
            value={address}
            onChangeText={setAddress}
            placeholder={digital ? '+91 98290 11234' : 'House no., street, city, PIN'}
            multiline={!digital}
          />
          {error ? (
            <Text variant="bodySm" color={colors.error}>
              {error}
            </Text>
          ) : null}
          <Button title="Confirm Request" variant="gold" icon="redeem" onPress={() => void submit()} loading={busy} disabled={address.trim().length < 5} />
          <Text variant="bodySm" color={colors.muted}>
            Your request is reviewed by the Levik team. Points are reserved now and deducted on approval.
          </Text>
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  tabular: { fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  hero: { flexDirection: 'row', gap: space.md },
  heroRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  balance: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginVertical: 2 },
  dream: { flexDirection: 'row', gap: space.lg, alignItems: 'center', padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  dreamIcon: { width: 88, height: 88, borderRadius: radius.lg, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  ribbon: { position: 'absolute', top: 0, right: 0 },
  item: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  itemIcon: { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  assure: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surfaceLow },
  assureIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.goldWash, alignItems: 'center', justifyContent: 'center' },
  summary: { gap: space.sm, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
});
