import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { $api, api, call, refreshAll } from '@/api/client';
import type { components } from '@/api/schema';
import { DOCK_HEIGHT } from '@/components/tab-dock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, HeroCard } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AppHeader, Screen } from '@/components/ui/screen';
import { Chips } from '@/components/ui/segmented';
import {Empty, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { formatINR, formatNumber, formatRelative } from '@/lib/format';
import { plumberTier } from '@/lib/tier';
import { colors, radius, space } from '@/theme/tokens';
import { PassbookSkeleton } from '@/components/skeletons';

type Entry = components['schemas']['PointsTransactionResponseDto'];
type Filter = 'all' | 'credits' | 'debits' | 'bonus';

const SOURCE_ICON: Record<Entry['source'], { icon: string; tone: 'emerald' | 'gold' | 'navy' | 'error' }> = {
  'Product Scan': { icon: 'qr_code_scanner', tone: 'navy' },
  'Invoice Incentive': { icon: 'receipt_long', tone: 'navy' },
  'Scheme Bonus': { icon: 'military_tech', tone: 'gold' },
  Redemption: { icon: 'redeem', tone: 'error' },
  'Redemption Reversal': { icon: 'undo', tone: 'emerald' },
  'Manual Adjustment': { icon: 'tune', tone: 'navy' },
  'Opening Balance': { icon: 'account_balance_wallet', tone: 'navy' },
};

const PAGE = 20;

/** Points ledger ("Passbook"): balance plinth + every credit/debit from the API, paginated. */
export function Passbook({ standalone = false }: { standalone?: boolean }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const wallet = $api.useQuery('get', '/api/v1/app/wallet');
  const ledger = useInfiniteQuery({
    queryKey: ['passbook'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => call(api.GET('/api/v1/app/wallet/transactions', { params: { query: { page: pageParam, pageSize: PAGE } } })),
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  });

  const loadError: unknown = wallet.error ?? ledger.error;
  if (wallet.isLoading || ledger.isLoading)
    return (
      <Screen header={<AppHeader back={standalone} brand={!standalone} eyebrow="Levik Atelier" title="Passbook Ledger" />} bottomInset={standalone ? 0 : DOCK_HEIGHT}>
        <PassbookSkeleton />
      </Screen>
    );
  if (loadError || !wallet.data) return <ErrorState error={loadError} onRetry={() => void Promise.all([wallet.refetch(), ledger.refetch()])} />;

  const w = wallet.data;
  const tier = plumberTier(w.lifetime);
  const all = ledger.data?.pages.flatMap((p) => p.items) ?? [];
  const entries = all.filter((e) =>
    filter === 'all' ? true : filter === 'credits' ? e.credit > 0 && e.source !== 'Scheme Bonus' : filter === 'debits' ? e.debit > 0 : e.source === 'Scheme Bonus',
  );
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const mtd = all.filter((e) => e.createdAt >= monthStart).reduce((s, e) => s + e.credit, 0);

  return (
    <Screen
      header={<AppHeader back={standalone} brand={!standalone} eyebrow="Levik Atelier" title="Passbook Ledger" />}
      bottomInset={standalone ? 0 : DOCK_HEIGHT}
      onRefresh={() => void refreshAll()}
      refreshing={ledger.isRefetching}
    >
      <View style={styles.compliance}>
        <View style={styles.row}>
          <Icon name="shield" size={16} color={colors.emeraldDeep} />
          <Text variant="labelMd" color={colors.navy}>
            Ledger is append-only
          </Text>
        </View>
        <Text variant="labelMd" color={colors.goldInk}>
          ● Sec 194R compliant
        </Text>
      </View>

      <HeroCard>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Icon name="account_balance_wallet" size={20} color={colors.goldLight} />
            <Text variant="labelSm" color={colors.onNavyMuted}>
              Master trade wallet
            </Text>
          </View>
          <Badge label={`${tier.multiplier} multiplier active`} tone="gold" icon="star" uppercase={false} />
        </View>
        <Text variant="labelSm" color={colors.onNavyMuted} style={styles.mt}>
          Total redeemable balance
        </Text>
        <View style={styles.balance}>
          <Text variant="display" color={colors.white} style={styles.tabular}>
            {formatINR(w.available)}
          </Text>
          <Text variant="labelLg" color={colors.goldLight}>
            ({formatNumber(w.available)} pts)
          </Text>
        </View>
        <View style={styles.row}>
          <Icon name="price_check" size={16} color={colors.emerald} />
          <Text variant="bodySm" color={colors.onNavyMuted}>
            1 pt = ₹1 direct cash value
          </Text>
        </View>
        <View style={styles.actions}>
          <Button title="Cashout" icon="account_balance" variant="gold" style={styles.flex} size="md" onPress={() => router.push('/cashout')} />
          <Button title="Redeem Gift" icon="redeem" variant="soft" style={styles.flex} size="md" onPress={() => router.push('/rewards')} />
        </View>
        <View style={styles.stats}>
          {[
            ['Lifetime earned', formatINR(w.lifetime), `${formatNumber(w.lifetime)} pts`],
            ['MTD accrued', `+${formatINR(mtd)}`, new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date()) + ' cycle'],
            ['Redeemed', formatINR(w.redeemed), 'Net of refunds'],
          ].map(([label, value, hint], i) => (
            <View key={label} style={styles.flex}>
              <Text variant="labelSm" color={colors.onNavyMuted}>
                {label}
              </Text>
              <Text variant="labelLg" color={i === 1 ? colors.emerald : colors.white}>
                {value}
              </Text>
              <Text variant="bodySm" color={colors.onNavyMuted}>
                {hint}
              </Text>
            </View>
          ))}
        </View>
      </HeroCard>

      <View style={styles.rowBetween}>
        <Text variant="headlineMd" color={colors.inkStrong}>
          Passbook Ledger
        </Text>
        <Text variant="labelMd" color={colors.goldInk}>
          {ledger.data?.pages[0]?.total ?? 0} entries
        </Text>
      </View>
      <Chips
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All transactions' },
          { value: 'credits', label: 'Carton scans (+)' },
          { value: 'debits', label: 'Redemptions (−)' },
          { value: 'bonus', label: 'Bonus schemes (+)' },
        ]}
      />

      {entries.length === 0 ? <Empty icon="receipt_long" title="No transactions yet" detail="Approved scans and redemptions appear here." /> : null}
      {entries.map((e) => {
        const meta = SOURCE_ICON[e.source];
        const credit = e.credit > 0;
        return (
          <Card key={e.id} style={styles.gap}>
            <View style={styles.entry}>
              <View style={[styles.entryIcon, { backgroundColor: meta.tone === 'gold' ? colors.goldWash : meta.tone === 'error' ? colors.errorWash : colors.surfaceMid }]}>
                <Icon name={meta.icon} color={meta.tone === 'gold' ? colors.goldInk : meta.tone === 'error' ? colors.error : colors.navy} />
              </View>
              <View style={styles.flex}>
                <Text variant="labelLg" color={colors.inkStrong}>
                  {e.note || e.source}
                </Text>
                <Text variant="bodySm" color={colors.muted}>
                  {e.source}
                  {e.related ? ` • ${e.related.id}` : ''}
                </Text>
                <Text variant="labelSm" color={colors.slate} style={styles.mtXs}>
                  {e.id}
                </Text>
              </View>
              <Text variant="headlineSm" color={credit ? colors.emeraldDeep : colors.error} style={styles.tabular}>
                {credit ? `+${formatNumber(e.credit)}` : `−${formatNumber(e.debit)}`} Pts
              </Text>
            </View>
            <View style={styles.rowBetween}>
              <Text variant="bodySm" color={colors.muted}>
                {formatRelative(e.createdAt)}
              </Text>
              <Badge
                label={credit ? (e.source === 'Scheme Bonus' ? 'One-time bonus' : 'Credited to wallet') : 'Debited'}
                tone={credit ? (e.source === 'Scheme Bonus' ? 'gold' : 'emerald') : 'error'}
                icon={credit ? 'check_circle' : 'done_all'}
                uppercase={false}
              />
            </View>
          </Card>
        );
      })}
      {ledger.hasNextPage ? <Button title="Load more" variant="outline" size="md" onPress={() => void ledger.fetchNextPage()} loading={ledger.isFetchingNextPage} /> : null}

      <View style={styles.footerNote}>
        <Icon name="verified_user" color={colors.goldInk} />
        <View style={styles.flex}>
          <Text variant="labelLg" color={colors.inkStrong}>
            Bank-grade ledger
          </Text>
          <Text variant="bodySm" color={colors.muted}>
            Every point is recorded once in Levik&apos;s append-only ledger. Balances are calculated from these entries, never edited.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  tabular: { fontVariant: ['tabular-nums'] },
  mt: { marginTop: space.lg },
  mtXs: { marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  compliance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceMid },
  balance: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginVertical: 4, flexWrap: 'wrap' },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  stats: { flexDirection: 'row', gap: space.md, marginTop: space.lg, padding: space.md, borderRadius: radius.lg, backgroundColor: 'rgba(0,0,0,0.18)' },
  entry: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  entryIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  footerNote: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surfaceMid },
});
