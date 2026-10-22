import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { $api, api, call, refreshAll } from '@/api/client';
import { errorMessage } from '@/api/errors';
import { ListCardsSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { AppHeader, Screen } from '@/components/ui/screen';
import { Empty, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { openDocument } from '@/lib/documents';
import { formatINR, formatRelative } from '@/lib/format';
import { colors, radius, space } from '@/theme/tokens';
import { QtyStepper } from './trade-parts';

/** Bills issued by this store: for confirmed plumber sales and for walk-in customers. */
export function BillsScreen() {
  const router = useRouter();
  const bills = $api.useQuery('get', '/api/v1/app/bills', { params: { query: { pageSize: 50 } } });
  const loadError: unknown = bills.error;
  if (loadError) return <ErrorState error={loadError} onRetry={() => void bills.refetch()} />;
  const items = bills.data?.items ?? [];
  return (
    <Screen
      header={<AppHeader back eyebrow="Your shop" title="Bills" right={<Button title="New bill" icon="add" size="md" onPress={() => router.push('/bills/new')} />} />}
      onRefresh={() => void bills.refetch()}
      refreshing={bills.isRefetching}
    >
      {bills.isLoading ? (
        <ListCardsSkeleton count={4} />
      ) : items.length === 0 ? (
        <Card>
          <Empty icon="receipt" title="No bills yet" detail="Bill buyers when you confirm a plumber's purchase, or create a bill for a walk-in customer." />
        </Card>
      ) : (
        items.map((bill) => (
          <Card key={bill.id} style={styles.gap}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <Text variant="labelLg" color={colors.inkStrong}>
                  {bill.billNumber} · {bill.customerName}
                </Text>
                <Text variant="bodySm" color={colors.muted}>
                  {formatRelative(bill.createdAt)} · {bill.scanId ? 'Plumber sale' : 'Walk-in'}
                </Text>
              </View>
              <Text variant="headlineSm" color={colors.inkStrong}>
                {formatINR(bill.totalValue)}
              </Text>
            </View>
            <Text variant="bodySm" color={colors.muted} numberOfLines={2}>
              {bill.lines.map((l) => `${l.quantity} × ${l.productName}`).join(' · ')}
            </Text>
            <Button title="Open PDF" icon="description" variant="soft" size="md" onPress={() => openDocument(bill.pdfUrl)} />
          </Card>
        ))
      )}
    </Screen>
  );
}

/** Walk-in sale: pick products from stock, bill the customer, stock goes down. */
export function NewBillScreen() {
  const router = useRouter();
  const stock = $api.useQuery('get', '/api/v1/app/inventory', { params: { query: { pageSize: 100 } } });
  const products = $api.useQuery('get', '/api/v1/app/products', { params: { query: { pageSize: 100 } } });
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prices = new Map((products.data?.items ?? []).map((p) => [p.id, p.listPrice]));
  const inStock = (stock.data?.items ?? []).filter((i) => i.quantity > 0);
  const lines = Object.entries(qty).filter(([, n]) => n > 0);
  const total = lines.reduce((s, [id, n]) => s + n * (prices.get(id) ?? 0), 0);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const bill = await call(
        api.POST('/api/v1/app/bills', {
          body: { customerName: name.trim(), customerMobile: mobile.trim() || undefined, lines: lines.map(([productId, quantity]) => ({ productId, quantity })) },
        }),
      );
      await refreshAll();
      openDocument(bill.pdfUrl);
      router.replace('/bills');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<AppHeader back eyebrow="Walk-in sale" title="New bill" />}
      footer={
        lines.length ? (
          <View style={styles.footer}>
            <Text variant="headlineSm" color={colors.inkStrong} style={styles.flex}>
              {formatINR(total)}
            </Text>
            <Button title="Create bill" icon="receipt" variant="gold" size="md" loading={busy} disabled={name.trim().length < 2} onPress={() => void submit()} />
          </View>
        ) : undefined
      }
    >
      <Card style={styles.gap}>
        <Field label="Customer name" value={name} onChangeText={setName} placeholder="e.g. Aman Kumar" />
        <Field label="Customer mobile (optional)" value={mobile} onChangeText={setMobile} placeholder="98765 43210" keyboardType="phone-pad" />
      </Card>
      <Text variant="headlineSm" color={colors.inkStrong}>
        Items from your stock
      </Text>
      {error ? (
        <Text variant="bodySm" color={colors.error}>
          {error}
        </Text>
      ) : null}
      {stock.isLoading ? (
        <ListCardsSkeleton count={3} />
      ) : inStock.length === 0 ? (
        <Card>
          <Empty icon="inventory_2" title="Nothing in stock" detail="Bills take items out of your stock. Order stock or correct your counts first." />
        </Card>
      ) : (
        inStock.map((item) => (
          <View key={item.productId} style={styles.item}>
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.inkStrong} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                {formatINR(prices.get(item.productId) ?? 0)} · {item.quantity} in stock
              </Text>
            </View>
            <QtyStepper value={qty[item.productId] ?? 0} max={item.quantity} label={item.productName} onChange={(n) => setQty((q) => ({ ...q, [item.productId]: n }))} />
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
