import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { $api, refreshAll } from '@/api/client';
import { DOCK_HEIGHT } from '@/components/tab-dock';
import { Badge } from '@/components/ui/badge';
import { Card, HeroCard } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Screen, SectionTitle } from '@/components/ui/screen';
import { Empty, ErrorState, Loading } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { formatDate, formatINR, formatNumber, formatRelative } from '@/lib/format';
import { retailerTier } from '@/lib/tier';
import { colors, radius, shadows, space } from '@/theme/tokens';
import { ActivityRow, HomeTopBar, initialsOf, ManagerCard, QuickActions, StatTile } from '../shared/parts';

const daysLeftInMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
};

export function RetailerHome() {
  const router = useRouter();
  const me = $api.useQuery('get', '/api/v1/app/retailers/me');
  const invoices = $api.useQuery('get', '/api/v1/app/invoices', { params: { query: { pageSize: 20 } } });
  const schemes = $api.useQuery('get', '/api/v1/app/schemes');
  const stock = $api.useQuery('get', '/api/v1/app/inventory', { params: { query: { pageSize: 100 } } });

  const loadError: unknown = me.error;
  if (me.isLoading) return <Loading />;
  if (loadError || !me.data) return <ErrorState error={loadError} onRetry={() => void me.refetch()} />;

  const r = me.data;
  const tier = retailerTier(r.achievementPct);
  const items = invoices.data?.items ?? [];
  const inReview = items.filter((i) => i.status === 'Submitted' || i.status === 'Under Review');
  const reviewValue = inReview.reduce((s, i) => s + i.amount, 0);
  const live = (schemes.data ?? []).filter((s) => s.status === 'Active' || s.status === 'Scheduled');
  const lowStock = (stock.data?.items ?? []).filter((i) => i.stockStatus !== 'In Stock').length;
  const remaining = Math.max(0, r.monthlyTarget - r.sales30d);
  const pending = r.verificationStatus !== 'Approved';

  return (
    <View style={styles.flex}>
      <HomeTopBar title="Home" initials={initialsOf(r.ownerName)} />
      <Screen bottomInset={DOCK_HEIGHT} onRefresh={() => void refreshAll()} refreshing={me.isRefetching}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Icon name="verified" size={18} color={colors.goldInk} />
            <Text variant="labelSm" color={colors.goldInk}>
              {pending ? 'Partner application' : 'Authorized partner'}
            </Text>
          </View>
          <Badge label={tier.name} tone="gold" icon="workspace_premium" />
        </View>
        <View style={styles.titleBlock}>
          <Text variant="headlineXl" color={colors.inkStrong}>
            {r.shopName}
          </Text>
          <View style={styles.row}>
            <Badge label={`GSTIN: ${r.gstin ?? 'Not registered'}`} tone="neutral" uppercase={false} />
            <Badge label={r.verificationStatus === 'Approved' ? 'KYC verified' : `KYC ${r.verificationStatus.toLowerCase()}`} tone={pending ? 'warning' : 'emerald'} icon={pending ? 'hourglass_top' : 'check_circle'} uppercase={false} />
          </View>
        </View>

        {pending ? (
          <View style={styles.notice}>
            <Icon name="hourglass_top" color={colors.warning} />
            <Text variant="body" color={colors.inkStrong} style={styles.flex}>
              {r.verificationStatus === 'Rejected'
                ? `Application rejected: ${r.rejectionReason ?? 'contact your territory manager.'}`
                : 'Your shop is being reviewed by the Levik team. You can upload invoices; incentives are credited after approval.'}
            </Text>
          </View>
        ) : null}

        <HeroCard>
          <View style={styles.rowBetween}>
            <Text variant="labelSm" color={colors.goldLight}>
              Monthly sales target
            </Text>
            <Badge label={`${r.achievementPct}% reached`} tone="gold" icon="trending_up" uppercase={false} />
          </View>
          <View style={styles.target}>
            <Text variant="currency" color={colors.white} style={styles.tabular}>
              {formatINR(r.sales30d)}
            </Text>
            <Text variant="bodyLg" color={colors.onNavyMuted}>
              / {formatINR(r.monthlyTarget)}
            </Text>
          </View>
          <Text variant="bodySm" color={colors.onNavyMuted}>
            Approved invoices, last 30 days · {daysLeftInMonth()} days left this month
          </Text>
          <View style={styles.slabs}>
            <Progress value={r.achievementPct} track="rgba(255,255,255,0.15)" height={8} />
            <View style={styles.rowBetween}>
              {[
                ['50% Silver', 50],
                ['75% Gold', 75],
                ['100% Cash Bonus', 100],
              ].map(([label, at]) => (
                <View key={label as string} style={styles.slab}>
                  <View style={[styles.slabDot, { backgroundColor: r.achievementPct >= (at as number) ? colors.emerald : colors.goldLight }]} />
                  <Text variant="labelSm" color={r.achievementPct >= (at as number) ? colors.emerald : colors.onNavyMuted} style={styles.none}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          {remaining > 0 ? (
            <View style={styles.nextSlab}>
              <Icon name="celebration" color={colors.goldLight} />
              <View style={styles.flex}>
                <Text variant="labelLg" color={colors.white}>
                  Next slab: {tier.next?.name ?? 'Cash bonus'}
                </Text>
                <Text variant="bodySm" color={colors.onNavyMuted}>
                  Achieve {formatINR(remaining)} more to reach your monthly target
                </Text>
              </View>
            </View>
          ) : null}
        </HeroCard>

        <QuickActions
          items={[
            { icon: 'receipt_long', label: 'Upload Invoice', href: '/invoice-upload', highlight: true },
            { icon: 'inventory_2', label: 'Catalog & Stock', href: '/products' },
            { icon: 'redeem', label: 'Rewards', href: '/rewards' },
            { icon: 'account_balance_wallet', label: 'Sales Ledger', href: '/history' },
          ]}
        />

        <SectionTitle title="Dealer Performance Metrics" action="Live sync" />
        <View style={styles.grid}>
          <StatTile label="Incentive pool" value={formatNumber(r.points.available)} hint={`Equiv. ${formatINR(r.points.available)} redeemable`} icon="stars" tone="gold" />
          <StatTile label="Verification" value={`${inReview.length} Bills`} hint={`Under review (${formatINR(reviewValue)})`} icon="hourglass_top" />
        </View>
        <View style={styles.grid}>
          <StatTile label="Live schemes" value={`${live.length} Running`} hint="Retailer target schemes" icon="campaign" tone="emerald" />
          <StatTile label="Inventory check" value={`${lowStock} Low SKUs`} hint={lowStock ? 'Re-order required' : 'All lines in stock'} icon="warning" tone={lowStock ? 'error' : 'emerald'} />
        </View>

        <SectionTitle title="Special Trade Schemes" action={`See all (${live.length})`} />
        {live.length === 0 ? (
          <Card>
            <Empty icon="campaign" title="No live schemes" detail="New trade schemes from Levik will appear here." />
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.schemes}>
            {live.map((s) => (
              <View key={s.id} style={styles.scheme}>
                <View style={styles.schemeBanner}>
                  <Badge label={`+${formatNumber(s.incentivePoints)} pts bonus`} tone="gold" uppercase={false} />
                  <Text variant="labelMd" color={colors.white}>
                    Valid till {formatDate(s.endDate)}
                  </Text>
                </View>
                <View style={styles.schemeBody}>
                  <Text variant="headlineSm" color={colors.inkStrong}>
                    {s.name}
                  </Text>
                  <Text variant="bodySm" color={colors.muted} numberOfLines={2}>
                    {s.description}
                  </Text>
                  <Progress value={s.percent} />
                  <View style={styles.rowBetween}>
                    <Text variant="labelMd" color={colors.slate}>
                      {formatINR(s.progress)} / {formatINR(s.targetValue)}
                    </Text>
                    <Badge label={s.awarded ? 'Achieved' : s.status} tone={s.awarded ? 'emerald' : 'navy'} uppercase={false} />
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <Card style={styles.gap}>
          <SectionTitle title="Recent Invoices" action="Full ledger" onAction={() => router.push('/history')} />
          {items.length === 0 ? <Empty icon="receipt_long" title="No invoices yet" detail="Upload a GST invoice to start earning incentives." /> : null}
          {items.slice(0, 4).map((i) => (
            <ActivityRow
              key={i.id}
              icon={i.status === 'Approved' ? 'task_alt' : i.status === 'Rejected' ? 'cancel' : 'pending'}
              tone={i.status === 'Approved' ? 'emerald' : i.status === 'Rejected' ? 'error' : 'gold'}
              title={`${i.invoiceNumber} · ${i.status}`}
              subtitle={`Billed ${formatRelative(i.invoiceDate)} • ${i.buyerName}`}
              amount={formatINR(i.amount)}
              amountTone="navy"
              caption={i.incentivePoints ? `+${formatNumber(i.incentivePoints)} pts credited` : i.status === 'Rejected' ? 'No incentive' : 'In review'}
              onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: i.id } })}
            />
          ))}
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
  none: { textTransform: 'none' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  titleBlock: { gap: space.sm },
  notice: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.warningWash },
  target: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginTop: space.sm },
  slabs: { gap: space.sm, marginTop: space.lg },
  slab: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  slabDot: { width: 6, height: 6, borderRadius: 3 },
  nextSlab: { flexDirection: 'row', gap: space.md, alignItems: 'center', marginTop: space.lg, padding: space.md, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.08)' },
  grid: { flexDirection: 'row', gap: space.md },
  schemes: { gap: space.md },
  scheme: { width: 280, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden', ...shadows.card },
  schemeBanner: { height: 96, padding: space.md, justifyContent: 'space-between', backgroundColor: colors.navyRaised },
  schemeBody: { padding: space.lg, gap: space.sm },
});
