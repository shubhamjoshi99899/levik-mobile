import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
import { Sheet } from '@/components/ui/sheet';
import { Empty, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { formatNumber, formatRelative } from '@/lib/format';
import { colors, radius, space } from '@/theme/tokens';
import type { StockMovement } from './trade-parts';

type Item = components['schemas']['InventoryItemResponseDto'];

const REASON_ICON: Record<StockMovement['reason'], string> = {
  'Opening stock': 'flag',
  'Order delivered': 'local_shipping',
  'Plumber sale': 'engineering',
  'Customer bill': 'receipt',
  'Manual adjustment': 'tune',
};

/**
 * Current stock per product. Delivered orders add stock; confirmed plumber sales and bills take it out.
 * Counts can still be corrected by hand, which is recorded as a manual adjustment.
 */
export function StockScreen() {
  const router = useRouter();
  const stock = $api.useQuery('get', '/api/v1/app/inventory', { params: { query: { pageSize: 100 } } });
  const [open, setOpen] = useState<Item | null>(null);
  const loadError: unknown = stock.error;
  if (loadError) return <ErrorState error={loadError} onRetry={() => void stock.refetch()} />;
  const items = stock.data?.items ?? [];
  const units = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Screen
      header={<AppHeader back eyebrow="Your shop" title="Stock" right={<Button title="Order" icon="add_shopping_cart" size="md" variant="soft" onPress={() => router.push('/orders/new')} />} />}
      onRefresh={() => void stock.refetch()}
      refreshing={stock.isRefetching}
    >
      <View style={styles.summary}>
        <Icon name="inventory_2" color={colors.goldLight} />
        <View style={styles.flex}>
          <Text variant="headlineMd" color={colors.white}>
            {formatNumber(units)} units
          </Text>
          <Text variant="bodySm" color={colors.onNavyMuted}>
            Updated automatically by delivered orders, confirmed sales and bills
          </Text>
        </View>
      </View>
      {stock.isLoading ? (
        <ListCardsSkeleton count={4} />
      ) : items.length === 0 ? (
        <Card>
          <Empty icon="inventory_2" title="No stock yet" detail="Order stock from Levik; it is added here when the order is delivered." />
        </Card>
      ) : (
        items.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.productName}, ${item.quantity} in stock`} onPress={() => setOpen(item)} style={({ pressed }) => [styles.item, pressed && { opacity: 0.9 }]}>
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.inkStrong} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                Model {item.modelCode} · updated {formatRelative(item.updatedAt)}
              </Text>
            </View>
            <View style={styles.qty}>
              <Text variant="headlineMd" color={colors.inkStrong}>
                {item.quantity}
              </Text>
              <Badge label={item.stockStatus} tone={item.stockStatus === 'In Stock' ? 'emerald' : item.stockStatus === 'Low Stock' ? 'warning' : 'error'} uppercase={false} />
            </View>
          </Pressable>
        ))
      )}
      {open ? <StockSheet item={open} onClose={() => setOpen(null)} /> : null}
    </Screen>
  );
}

function StockSheet({ item, onClose }: { item: Item; onClose: () => void }) {
  const history = $api.useQuery('get', '/api/v1/app/inventory/movements', { params: { query: { productId: item.productId, pageSize: 20 } } });
  const [count, setCount] = useState(String(item.quantity));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const quantity = Number(count);
  const valid = count.trim() !== '' && Number.isInteger(quantity) && quantity >= 0;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await call(api.PUT('/api/v1/app/inventory/{productId}', { params: { path: { productId: item.productId } }, body: { quantity } }));
      await refreshAll();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title={item.productName}>
      <View style={styles.correct}>
        <Field label="Correct the count" value={count} onChangeText={setCount} keyboardType="number-pad" hint="Only if the shelf count differs; the change is logged" error={error ?? undefined} />
        <Button title="Save count" size="md" loading={busy} disabled={!valid || quantity === item.quantity} onPress={() => void save()} />
      </View>
      <Text variant="labelLg" color={colors.inkStrong}>
        History
      </Text>
      {(history.data?.items ?? []).length === 0 ? (
        <Text variant="bodySm" color={colors.muted}>
          No changes recorded yet.
        </Text>
      ) : (
        (history.data?.items ?? []).map((m) => (
          <View key={m.id} style={styles.move}>
            <Icon name={REASON_ICON[m.reason]} size={18} color={colors.slate} />
            <View style={styles.flex}>
              <Text variant="labelMd" color={colors.inkStrong}>
                {m.reason}
                {m.relatedId ? ` · ${m.relatedId}` : ''}
              </Text>
              <Text variant="bodySm" color={colors.muted} numberOfLines={1}>
                {formatRelative(m.createdAt)}
                {m.note ? ` · ${m.note}` : ''}
              </Text>
            </View>
            <View style={styles.qty}>
              <Text variant="labelLg" color={m.delta > 0 ? colors.emeraldDeep : colors.error}>
                {m.delta > 0 ? `+${m.delta}` : m.delta}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                = {m.balanceAfter}
              </Text>
            </View>
          </View>
        ))
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.navy },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  qty: { alignItems: 'flex-end', gap: 4 },
  correct: { gap: space.sm },
  move: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs },
});
