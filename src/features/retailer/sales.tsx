import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { $api, api, call, refreshAll } from '@/api/client';
import { errorMessage } from '@/api/errors';
import type { components } from '@/api/schema';
import { ListCardsSkeleton } from '@/components/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { AppHeader, Screen } from '@/components/ui/screen';
import { Chips } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Empty, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { openDocument } from '@/lib/documents';
import { formatINR, formatNumber, formatRelative, maskMobile } from '@/lib/format';
import { colors, radius, space } from '@/theme/tokens';
import { ProductThumb } from '../shared/parts';
import type { Sale } from './trade-parts';

type Decision = 'Pending' | 'Confirmed' | 'Declined';
type ConfirmResult = components['schemas']['ConfirmSaleResponseDto'];

/**
 * Plumbers who scanned a product and said they bought it here. Confirming takes one unit out of stock,
 * credits your incentive, can bill the buyer, and lets the plumber's points go through.
 */
export function SalesScreen() {
  const [decision, setDecision] = useState<Decision>('Pending');
  const [confirming, setConfirming] = useState<Sale | null>(null);
  const [declining, setDeclining] = useState<Sale | null>(null);
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const sales = $api.useQuery('get', '/api/v1/app/sales', { params: { query: { decision, pageSize: 50 } } });
  const pendingCount = $api.useQuery('get', '/api/v1/app/sales', { params: { query: { decision: 'Pending', pageSize: 1 } } });

  const loadError: unknown = sales.error;
  if (loadError) return <ErrorState error={loadError} onRetry={() => void sales.refetch()} />;
  const items = sales.data?.items ?? [];

  return (
    <Screen header={<AppHeader back eyebrow="Plumber purchases" title="Sales to confirm" />} onRefresh={() => void sales.refetch()} refreshing={sales.isRefetching}>
      <Chips
        value={decision}
        onChange={setDecision}
        options={[
          { value: 'Pending', label: 'To confirm', count: pendingCount.data?.total },
          { value: 'Confirmed', label: 'Confirmed' },
          { value: 'Declined', label: 'Declined' },
        ]}
      />
      {result ? <ResultBanner result={result} onClose={() => setResult(null)} /> : null}
      {sales.isLoading ? (
        <ListCardsSkeleton count={3} />
      ) : items.length === 0 ? (
        <Card>
          <Empty
            icon="storefront"
            title={decision === 'Pending' ? 'Nothing to confirm' : `No ${decision.toLowerCase()} sales`}
            detail={decision === 'Pending' ? 'When a plumber scans a product bought from your shop, it appears here for you to confirm.' : undefined}
          />
        </Card>
      ) : (
        items.map((sale) => <SaleCard key={sale.scanId} sale={sale} onConfirm={() => setConfirming(sale)} onDecline={() => setDeclining(sale)} />)
      )}
      {confirming ? (
        <ConfirmSheet
          sale={confirming}
          onClose={() => setConfirming(null)}
          onDone={(r) => {
            setConfirming(null);
            setResult(r);
          }}
        />
      ) : null}
      {declining ? <DeclineSheet sale={declining} onClose={() => setDeclining(null)} /> : null}
    </Screen>
  );
}

function SaleCard({ sale, onConfirm, onDecline }: { sale: Sale; onConfirm: () => void; onDecline: () => void }) {
  return (
    <Card style={styles.gap}>
      <View style={styles.row}>
        <ProductThumb imageUrl={sale.imageUrl} size={56} label={sale.productName} />
        <View style={styles.flex}>
          <Text variant="labelLg" color={colors.inkStrong} numberOfLines={1}>
            {sale.productName}
          </Text>
          <Text variant="bodySm" color={colors.muted}>
            Serial {sale.serial}
          </Text>
          <Text variant="bodySm" color={colors.muted}>
            {formatRelative(sale.scannedAt)}
            {sale.siteLocation ? ` · ${sale.siteLocation}` : ''}
          </Text>
        </View>
        <Badge label={`+${formatNumber(sale.incentivePoints)} pts`} tone="gold" uppercase={false} />
      </View>
      <View style={styles.buyer}>
        <Icon name="engineering" size={18} color={colors.slate} />
        <Text variant="body" color={colors.ink} style={styles.flex}>
          {sale.plumberName} · {maskMobile(sale.plumberMobile)}
        </Text>
      </View>
      {sale.decision === 'Pending' ? (
        <View style={styles.actions}>
          <Button title="Not sold here" variant="outline" size="md" style={styles.flex} onPress={onDecline} />
          <Button title="Confirm sale" icon="check_circle" variant="gold" size="md" style={styles.flex} onPress={onConfirm} />
        </View>
      ) : (
        <View style={styles.rowBetween}>
          <Badge label={sale.decision} tone={sale.decision === 'Confirmed' ? 'emerald' : 'neutral'} icon={sale.decision === 'Confirmed' ? 'check_circle' : 'block'} uppercase={false} />
          {sale.billPdfUrl ? <Button title={`Bill ${sale.billNumber}`} icon="description" variant="soft" size="md" onPress={() => openDocument(sale.billPdfUrl)} /> : null}
        </View>
      )}
    </Card>
  );
}

function ConfirmSheet({ sale, onClose, onDone }: { sale: Sale; onClose: () => void; onDone: (result: ConfirmResult) => void }) {
  const [withBill, setWithBill] = useState(true);
  const [name, setName] = useState(sale.plumberName);
  const [mobile, setMobile] = useState('');
  const [price, setPrice] = useState(String(sale.listPrice));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const priceValue = Number(price.replace(/[^\d]/g, ''));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await call(
        api.POST('/api/v1/app/sales/{scanId}/confirm', {
          params: { path: { scanId: sale.scanId } },
          body: withBill ? { bill: { customerName: name.trim(), customerMobile: mobile.trim() || undefined, unitPrice: Number.isFinite(priceValue) ? priceValue : undefined } } : {},
        }),
      );
      await refreshAll();
      onDone(result);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title="Confirm this sale">
      <Text variant="body" color={colors.muted}>
        1 × {sale.productName} sold to {sale.plumberName}. One unit leaves your stock and you earn {formatNumber(sale.incentivePoints)} points.
      </Text>
      <View style={styles.toggle}>
        <View style={styles.flex}>
          <Text variant="labelLg" color={colors.inkStrong}>
            Generate a bill for the buyer
          </Text>
          <Text variant="bodySm" color={colors.muted}>
            A PDF from your store, with the Levik mark
          </Text>
        </View>
        <Switch value={withBill} onValueChange={setWithBill} trackColor={{ true: colors.gold, false: colors.surfaceHigh }} thumbColor={colors.white} accessibilityLabel="Generate a bill" />
      </View>
      {withBill ? (
        <>
          <Field label="Bill to" value={name} onChangeText={setName} placeholder="Customer name, e.g. Aman Kumar" />
          <Field label="Customer mobile (optional)" value={mobile} onChangeText={setMobile} placeholder="98765 43210" keyboardType="phone-pad" />
          <Field label="Selling price" value={price} onChangeText={setPrice} keyboardType="number-pad" prefix={<Text variant="labelLg">₹</Text>} hint={`Catalogue price ${formatINR(sale.listPrice)}`} />
        </>
      ) : null}
      {error ? (
        <Text variant="bodySm" color={colors.error}>
          {error}
        </Text>
      ) : null}
      <Button title="Confirm sale" icon="check_circle" variant="gold" loading={busy} disabled={withBill && name.trim().length < 2} onPress={() => void submit()} />
    </Sheet>
  );
}

function DeclineSheet({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await call(api.POST('/api/v1/app/sales/{scanId}/decline', { params: { path: { scanId: sale.scanId } }, body: { reason: reason.trim() } }));
      await refreshAll();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} title="Not sold from your shop?">
      <Text variant="body" color={colors.muted}>
        Nothing changes in your stock or points. Levik will review {sale.plumberName}&apos;s scan.
      </Text>
      <Field label="What happened?" value={reason} onChangeText={setReason} placeholder="e.g. We have not sold this model to him" error={error ?? undefined} />
      <Button title="Decline sale" variant="danger" loading={busy} disabled={reason.trim().length < 5} onPress={() => void submit()} />
    </Sheet>
  );
}

function ResultBanner({ result, onClose }: { result: ConfirmResult; onClose: () => void }) {
  return (
    <View style={styles.banner}>
      <Icon name="check_circle" color={colors.emeraldDeep} />
      <View style={styles.flex}>
        <Text variant="labelLg" color={colors.inkStrong}>
          Sale confirmed · +{formatNumber(result.retailerPoints)} points
        </Text>
        <Text variant="bodySm" color={colors.muted}>
          {result.autoApproved ? 'The plumber has been credited too.' : `The plumber is credited once Levik clears: ${result.pendingReasons.join(', ')}.`}
        </Text>
        {result.billPdfUrl ? <Button title="Open bill" icon="description" variant="soft" size="md" style={styles.bannerBtn} onPress={() => openDocument(result.billPdfUrl)} /> : null}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={10} onPress={onClose}>
        <Icon name="close" size={18} color={colors.slate} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  buyer: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm, borderRadius: radius.md, backgroundColor: colors.surfaceLow },
  actions: { flexDirection: 'row', gap: space.sm },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  banner: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.emeraldWash },
  bannerBtn: { alignSelf: 'flex-start', marginTop: space.sm },
});
