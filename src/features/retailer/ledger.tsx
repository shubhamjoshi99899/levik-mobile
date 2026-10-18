import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { $api, refreshAll } from '@/api/client';
import { DOCK_HEIGHT } from '@/components/tab-dock';
import { Badge, type Tone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, HeroCard } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { AppHeader, Screen } from '@/components/ui/screen';
import { Chips } from '@/components/ui/segmented';
import { Empty, ErrorState, Loading } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { formatDate, formatINR, formatNumber, formatRelative } from '@/lib/format';
import { retailerTier } from '@/lib/tier';
import { GST } from '@/mocks';
import { colors, radius, space } from '@/theme/tokens';

type Filter = 'all' | 'Approved' | 'review' | 'Rejected';
const TONE: Record<string, Tone> = { Submitted: 'gold', 'Under Review': 'gold', Approved: 'emerald', Rejected: 'error', 'More Information Required': 'warning' };

/** Retailer "GST Tax Ledger": live incentives and invoices; GST reconciliation is a labelled preview (mock). */
export function RetailerLedger() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const me = $api.useQuery('get', '/api/v1/app/retailers/me');
  const invoices = $api.useQuery('get', '/api/v1/app/invoices', { params: { query: { pageSize: 100 } } });

  const loadError: unknown = me.error ?? invoices.error;
  if (me.isLoading || invoices.isLoading) return <Loading />;
  if (loadError || !me.data) return <ErrorState error={loadError} onRetry={() => void Promise.all([me.refetch(), invoices.refetch()])} />;

  const r = me.data;
  const all = invoices.data?.items ?? [];
  const review = all.filter((i) => i.status === 'Submitted' || i.status === 'Under Review' || i.status === 'More Information Required');
  const counts = { all: all.length, Approved: all.filter((i) => i.status === 'Approved').length, review: review.length, Rejected: all.filter((i) => i.status === 'Rejected').length };
  const shown = filter === 'all' ? all : filter === 'review' ? review : all.filter((i) => i.status === filter);
  const tier = retailerTier(r.achievementPct);
  const remaining = Math.max(0, r.monthlyTarget - r.sales30d);

  return (
    <Screen header={<AppHeader brand eyebrow="Levik Atelier" title="GST Tax Ledger" />} bottomInset={DOCK_HEIGHT} onRefresh={() => void refreshAll()} refreshing={invoices.isRefetching}>
      <Card style={styles.gap}>
        <View style={styles.row}>
          <View style={styles.shopIcon}>
            <Icon name="storefront" color={colors.goldLight} />
          </View>
          <View style={styles.flex}>
            <Text variant="headlineSm" color={colors.inkStrong}>
              {r.shopName}
            </Text>
            <Text variant="bodySm" color={colors.muted}>
              Incentive ledger & tax compliance
            </Text>
          </View>
          <Badge label={r.gstin ? 'GST active' : 'No GSTIN'} tone={r.gstin ? 'emerald' : 'warning'} uppercase={false} />
        </View>
        {r.gstin ? (
          <View style={styles.gstin}>
            <Icon name="receipt" size={16} color={colors.slate} />
            <Text variant="labelLg" color={colors.inkStrong} style={styles.flex}>
              {r.gstin}
            </Text>
            <Text variant="labelMd" color={colors.emeraldDeep}>
              Active filer
            </Text>
          </View>
        ) : null}
      </Card>

      <HeroCard style={styles.gap}>
        <Badge label="Incentive balance" tone="soft" icon="stars" />
        <Text variant="labelSm" color={colors.onNavyMuted}>
          Total earned B2B incentives
        </Text>
        <Text variant="currency" color={colors.white}>
          {formatNumber(r.points.lifetime)} <Text variant="labelLg" color={colors.goldLight}>pts</Text>
        </Text>
        <View style={styles.row}>
          <View style={styles.heroTile}>
            <Text variant="labelSm" color={colors.onNavyMuted}>
              Redeemable
            </Text>
            <Text variant="headlineSm" color={colors.white}>
              {formatNumber(r.points.available)} pts
            </Text>
            <Text variant="bodySm" color={colors.onNavyMuted}>
              {formatNumber(r.points.redeemed)} redeemed
            </Text>
          </View>
          <View style={styles.heroTile}>
            <Text variant="labelSm" color={colors.onNavyMuted}>
              Pipeline
            </Text>
            <Text variant="headlineSm" color={colors.white}>
              {formatINR(review.reduce((s, i) => s + i.amount, 0))}
            </Text>
            <Text variant="bodySm" color={colors.onNavyMuted}>
              {review.length} invoices auditing
            </Text>
          </View>
        </View>
        <View style={styles.tierStrip}>
          <Icon name="workspace_premium" color={colors.goldLight} />
          <Text variant="labelMd" color={colors.goldLight} style={styles.flex}>
            {tier.name} • {tier.multiplier} wholesale kickback
          </Text>
        </View>
      </HeroCard>

      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <Text variant="labelLg" color={colors.inkStrong}>
            Monthly procurement target
          </Text>
          <Text variant="labelMd" color={colors.goldInk}>
            {r.achievementPct}% achieved
          </Text>
        </View>
        <Progress value={r.achievementPct} />
        <View style={styles.rowBetween}>
          <Text variant="bodySm" color={colors.muted}>
            {formatINR(r.sales30d)} billed
          </Text>
          <Text variant="bodySm" color={colors.muted}>
            Target: {formatINR(r.monthlyTarget)}
          </Text>
        </View>
        {remaining > 0 ? (
          <View style={styles.nudge}>
            <Icon name="redeem" color={colors.goldInk} />
            <Text variant="bodySm" color={colors.goldInk} style={styles.flex}>
              Procure {formatINR(remaining)} more to reach this month&apos;s target.
            </Text>
          </View>
        ) : null}
      </Card>

      <Chips
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All records', count: counts.all },
          { value: 'Approved', label: 'Approved', count: counts.Approved },
          { value: 'review', label: 'Under review', count: counts.review },
          { value: 'Rejected', label: 'Rejected', count: counts.Rejected },
        ]}
      />

      {shown.length === 0 ? <Empty icon="receipt_long" title="No invoices here" /> : null}
      {shown.map((i) => (
        <Card key={i.id} style={styles.gap}>
          <View style={styles.row}>
            <View style={styles.docIcon}>
              <Icon name="description" color={colors.navy} />
            </View>
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.inkStrong}>
                Invoice #{i.invoiceNumber}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                {i.buyerName}
              </Text>
            </View>
            <Text variant="headlineSm" color={colors.inkStrong}>
              {formatINR(i.amount)}
            </Text>
          </View>
          <View style={styles.timeline}>
            <View style={styles.flex}>
              <Text variant="labelSm" color={colors.slate}>
                Timeline
              </Text>
              <Text variant="bodySm" color={colors.ink}>
                Billed {formatDate(i.invoiceDate)}
                {i.reviewedAt ? ` • Reviewed ${formatDate(i.reviewedAt)}` : ` • Sent ${formatRelative(i.submittedAt)}`}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text variant="labelSm" color={colors.slate}>
                {i.status === 'Approved' ? 'Earned rewards' : 'Est. benefit'}
              </Text>
              <Text variant="bodySm" color={colors.ink}>
                {i.incentivePoints ? `+${formatNumber(i.incentivePoints)} pts` : i.status === 'Rejected' ? '—' : 'Calculated on review'}
              </Text>
            </View>
          </View>
          <View style={styles.rowBetween}>
            <Badge label={i.status} tone={TONE[i.status] ?? 'neutral'} uppercase={false} />
            <Button title="View" size="sm" variant="soft" trailingIcon="chevron_right" onPress={() => router.push({ pathname: '/invoice/[id]', params: { id: i.id } })} />
          </View>
        </Card>
      ))}

      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Icon name="verified_user" color={colors.navy} />
            <Text variant="headlineSm" color={colors.inkStrong}>
              GSTR-2B Reconciliation
            </Text>
          </View>
          <Badge label="Preview" tone="neutral" uppercase={false} />
        </View>
        <Text variant="bodySm" color={colors.muted}>
          Sample figures for {GST.quarter} ({GST.period}). Tax reconciliation is not connected yet.
        </Text>
        <View style={styles.row}>
          <View style={styles.gstTile}>
            <Text variant="labelSm" color={colors.slate}>
              ITC eligible
            </Text>
            <Text variant="headlineSm" color={colors.inkStrong}>
              {formatINR(GST.itcEligible, true)}
            </Text>
          </View>
          <View style={styles.gstTile}>
            <Text variant="labelSm" color={colors.slate}>
              Mismatches
            </Text>
            <Text variant="headlineSm" color={colors.emeraldDeep}>
              {GST.discrepancies} discrepancies
            </Text>
          </View>
        </View>
        <Button title={`Download ${GST.quarter.split(' ')[0]} tax statement`} icon="download" disabled />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  shopIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  gstin: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  heroTile: { flex: 1, gap: 2, padding: space.md, borderRadius: radius.lg, backgroundColor: 'rgba(0,0,0,0.2)' },
  tierStrip: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.lg, backgroundColor: 'rgba(197,160,89,0.15)' },
  nudge: { flexDirection: 'row', gap: space.sm, alignItems: 'center', padding: space.md, borderRadius: radius.lg, backgroundColor: colors.goldWash },
  docIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  timeline: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  gstTile: { flex: 1, gap: 2, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
});
