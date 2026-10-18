import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { $api, api, call, refreshAll, uploadFile } from '@/api/client';
import { errorMessage } from '@/api/errors';
import { Badge, type Tone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AppHeader, Screen } from '@/components/ui/screen';
import { ErrorState, Loading } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { formatDate, formatINR, formatNumber } from '@/lib/format';
import { pickDocument, takePhoto } from '@/lib/pick-file';
import { colors, radius, space } from '@/theme/tokens';

const TONE: Record<string, Tone> = { Submitted: 'gold', 'Under Review': 'gold', Approved: 'emerald', Rejected: 'error', 'More Information Required': 'warning' };

export function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const invoice = $api.useQuery('get', '/api/v1/app/invoices/{id}', { params: { path: { id } } });
  const incentive = $api.useQuery('get', '/api/v1/app/invoices/{id}/incentive', { params: { path: { id } } });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadError: unknown = invoice.error;
  if (invoice.isLoading) return <Loading />;
  if (loadError || !invoice.data) return <ErrorState error={loadError} onRetry={() => void invoice.refetch()} />;
  const inv = invoice.data;
  const inc = incentive.data;
  const gst = Math.round(inv.amount * 0.18);

  const resubmit = async (source: 'photo' | 'file') => {
    const file = source === 'photo' ? await takePhoto() : await pickDocument();
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const documentKey = await uploadFile(file, 'invoice-document');
      await call(api.POST('/api/v1/app/invoices/{id}/resubmit', { params: { path: { id } }, body: { documentKey } }));
      void refreshAll();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen header={<AppHeader back eyebrow="Invoice" title={inv.invoiceNumber} />} onRefresh={() => void refreshAll()} refreshing={invoice.isRefetching}>
      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <Badge label={inv.status} tone={TONE[inv.status] ?? 'neutral'} uppercase={false} />
          <Text variant="labelMd" color={colors.slate}>
            {inv.id}
          </Text>
        </View>
        <Text variant="currency" color={colors.inkStrong}>
          {formatINR(inv.amount)}
        </Text>
        <Text variant="bodySm" color={colors.muted}>
          Taxable value · billed {formatDate(inv.invoiceDate)} to {inv.buyerName}
        </Text>
        {inv.status === 'More Information Required' && inv.infoRequest ? (
          <View style={styles.warn}>
            <Icon name="info" color={colors.warning} />
            <Text variant="body" color={colors.inkStrong} style={styles.flex}>
              Levik team: {inv.infoRequest}
            </Text>
          </View>
        ) : null}
        {inv.status === 'Rejected' && inv.rejectionReason ? (
          <View style={styles.err}>
            <Icon name="cancel" color={colors.error} />
            <Text variant="body" color={colors.error} style={styles.flex}>
              {inv.rejectionReason}
            </Text>
          </View>
        ) : null}
      </Card>

      <Card style={styles.gap}>
        <Text variant="labelLg" color={colors.inkStrong}>
          Billed items ({inv.lines.length})
        </Text>
        {inv.lines.map((l) => (
          <View key={l.id} style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.inkStrong}>
                {l.productName}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                SKU {l.sku} · Qty {l.quantity} · {formatINR(l.unitPrice)}/pc
              </Text>
            </View>
            <Text variant="labelLg" color={colors.inkStrong}>
              {formatINR(l.value)}
            </Text>
          </View>
        ))}
        <View style={styles.totals}>
          <View style={styles.rowBetween}>
            <Text variant="body" color={colors.muted}>
              Total taxable value
            </Text>
            <Text variant="labelLg">{formatINR(inv.amount, true)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text variant="body" color={colors.muted}>
              CGST (9%) + SGST (9%)
            </Text>
            <Text variant="labelLg">{formatINR(gst, true)}</Text>
          </View>
          <View style={[styles.rowBetween, styles.totalRow]}>
            <Text variant="headlineSm" color={colors.inkStrong}>
              Total invoice amount
            </Text>
            <Text variant="headlineSm" color={colors.inkStrong}>
              {formatINR(inv.amount + gst, true)}
            </Text>
          </View>
        </View>
      </Card>

      {inc ? (
        <View style={styles.projection}>
          <View style={styles.projIcon}>
            <Icon name="stars" size={26} color={colors.goldInk} />
          </View>
          <View style={styles.flex}>
            <Text variant="labelSm" color={colors.goldInk}>
              {inv.status === 'Approved' ? 'Incentive credited' : 'Incentive accrual projection'}
            </Text>
            <Text variant="headlineXl" color={colors.inkStrong}>
              +{formatNumber(inv.incentivePoints ?? inc.points)} <Text variant="labelMd" color={colors.goldInk}>Trade points</Text>
            </Text>
            <Text variant="bodySm" color={colors.goldInk}>
              {inc.rate} pt per ₹100 on {formatINR(inc.eligibleValue)} eligible value
            </Text>
            {inc.lines
              .filter((l) => !l.eligible)
              .map((l) => (
                <Text key={l.lineId} variant="bodySm" color={colors.muted}>
                  {l.productName}: {l.reason}
                </Text>
              ))}
          </View>
        </View>
      ) : null}

      {inv.status === 'More Information Required' ? (
        <Card style={styles.gap}>
          <Text variant="labelLg" color={colors.inkStrong}>
            Resubmit with an updated document
          </Text>
          <View style={styles.row}>
            <Button title="Take photo" icon="photo_camera" size="md" style={styles.flex} onPress={() => void resubmit('photo')} loading={busy} />
            <Button title="Upload file" icon="upload_file" variant="outline" size="md" style={styles.flex} onPress={() => void resubmit('file')} disabled={busy} />
          </View>
          {error ? (
            <Text variant="bodySm" color={colors.error}>
              {error}
            </Text>
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  row: { flexDirection: 'row', gap: space.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  warn: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.warningWash },
  err: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.errorWash },
  totals: { gap: space.sm, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.sm },
  projection: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.goldSoft },
  projIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' },
});
