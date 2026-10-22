import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { $api, api, call, refreshAll } from '@/api/client';
import { errorMessage } from '@/api/errors';
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
import { formatDate, formatINR, formatNumber, formatRelative } from '@/lib/format';
import { colors, radius, space } from '@/theme/tokens';
import { ProductThumb } from '../shared/parts';
import { OrderProgress, OrderStatusBadge, QtyStepper, type Order, type OrderStatus } from './trade-parts';

type Filter = 'all' | OrderStatus;

/** The retailer's stock orders to Levik, newest first. */
export function OrdersScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const orders = $api.useQuery('get', '/api/v1/app/orders', {
    params: { query: { pageSize: 50, status: filter === 'all' ? undefined : filter } },
  });
  const header = <AppHeader back eyebrow="Levik trade" title="My orders" right={<Button title="New" icon="add" size="md" onPress={() => router.push('/orders/new')} />} />;
  const loadError: unknown = orders.error;
  if (loadError) return <ErrorState error={loadError} onRetry={() => void orders.refetch()} />;
  const items = orders.data?.items ?? [];
  return (
    <Screen header={header} onRefresh={() => void orders.refetch()} refreshing={orders.isRefetching}>
      <Chips
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'Placed', label: 'Placed' },
          { value: 'Confirmed', label: 'Confirmed' },
          { value: 'Dispatched', label: 'On the way' },
          { value: 'Delivered', label: 'Delivered' },
          { value: 'Cancelled', label: 'Cancelled' },
        ]}
      />
      {orders.isLoading ? (
        <ListCardsSkeleton count={4} />
      ) : items.length === 0 ? (
        <Card>
          <Empty icon="shopping_cart" title="No orders yet" detail="Order stock from the Levik catalogue. Delivered orders are added to your stock automatically." />
          <Button title="Order stock" icon="add_shopping_cart" onPress={() => router.push('/orders/new')} />
        </Card>
      ) : (
        items.map((order) => <OrderCard key={order.id} order={order} onPress={() => router.push(`/orders/${order.id}`)} />)
      )}
    </Screen>
  );
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Order ${order.id}, ${order.status}`} onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <View style={styles.rowBetween}>
        <Text variant="labelLg" color={colors.inkStrong}>
          {order.id}
        </Text>
        <OrderStatusBadge status={order.status} />
      </View>
      <Text variant="bodySm" color={colors.muted} numberOfLines={2}>
        {order.lines.map((l) => `${l.quantity} × ${l.productName}`).join(' · ')}
      </Text>
      <View style={styles.rowBetween}>
        <Text variant="bodySm" color={colors.muted}>
          {formatNumber(order.itemCount)} units · placed {formatRelative(order.placedAt)}
        </Text>
        <Text variant="headlineSm" color={colors.inkStrong}>
          {formatINR(order.totalValue)}
        </Text>
      </View>
      {order.purchaseInvoiceNumber ? (
        <View style={styles.invoiceRow}>
          <Icon name="description" size={16} color={colors.emeraldDeep} />
          <Text variant="labelMd" color={colors.emeraldDeep}>
            Invoice {order.purchaseInvoiceNumber}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = $api.useQuery('get', '/api/v1/app/orders/{id}', { params: { path: { id } } });
  const timeline = $api.useQuery('get', '/api/v1/app/orders/{id}/timeline', { params: { path: { id } } });
  const [cancelOpen, setCancelOpen] = useState(false);
  const header = <AppHeader back eyebrow="Order" title={id} />;
  if (order.isLoading)
    return (
      <Screen header={header}>
        <ListCardsSkeleton count={3} />
      </Screen>
    );
  const loadError: unknown = order.error;
  if (loadError || !order.data) return <ErrorState error={loadError} onRetry={() => void order.refetch()} />;
  const o = order.data;

  return (
    <Screen header={header} onRefresh={() => void order.refetch()} refreshing={order.isRefetching}>
      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <Text variant="bodySm" color={colors.muted}>
            Placed {formatDate(o.placedAt)}
          </Text>
          <OrderStatusBadge status={o.status} />
        </View>
        {o.status === 'Cancelled' ? (
          <Text variant="body" color={colors.ink}>
            Cancelled{o.cancelReason ? `: ${o.cancelReason}` : ''}. No stock was added.
          </Text>
        ) : (
          <OrderProgress status={o.status} />
        )}
        {o.status === 'Delivered' ? (
          <View style={styles.delivered}>
            <Icon name="inventory" color={colors.emeraldDeep} />
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.inkStrong}>
                Delivered {formatDate(o.deliveredAt)} · added to your stock
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                Purchase invoice {o.purchaseInvoiceNumber}
              </Text>
            </View>
          </View>
        ) : null}
        {o.purchaseInvoiceUrl ? <Button title="View purchase invoice" icon="description" variant="soft" onPress={() => openDocument(o.purchaseInvoiceUrl)} /> : null}
      </Card>

      <Card style={styles.gap}>
        <Text variant="headlineSm" color={colors.inkStrong}>
          Items
        </Text>
        {o.lines.map((line) => (
          <View key={line.productId} style={styles.line}>
            <ProductThumb imageUrl={line.imageUrl} size={52} label={line.productName} />
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.inkStrong} numberOfLines={1}>
                {line.productName}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                {line.quantity} × {formatINR(line.unitPrice)}
              </Text>
            </View>
            <Text variant="labelLg" color={colors.inkStrong}>
              {formatINR(line.value)}
            </Text>
          </View>
        ))}
        <View style={[styles.rowBetween, styles.total]}>
          <Text variant="bodySm" color={colors.muted}>
            {formatNumber(o.itemCount)} units · catalogue prices
          </Text>
          <Text variant="headlineMd" color={colors.inkStrong}>
            {formatINR(o.totalValue)}
          </Text>
        </View>
        {o.note ? (
          <Text variant="bodySm" color={colors.muted}>
            Note: {o.note}
          </Text>
        ) : null}
      </Card>

      {(timeline.data ?? []).length ? (
        <Card style={styles.gap}>
          <Text variant="headlineSm" color={colors.inkStrong}>
            History
          </Text>
          {(timeline.data ?? []).map((e, i) => (
            <View key={`${e.at}-${i}`} style={styles.event}>
              <View style={styles.dot} />
              <View style={styles.flex}>
                <Text variant="labelLg" color={colors.inkStrong}>
                  {e.action}
                </Text>
                <Text variant="bodySm" color={colors.muted}>
                  {formatRelative(e.at)} · {e.by}
                  {e.note ? ` · ${e.note}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {o.status === 'Placed' ? <Button title="Cancel order" icon="block" variant="outline" onPress={() => setCancelOpen(true)} /> : null}
      <CancelSheet open={cancelOpen} onClose={() => setCancelOpen(false)} orderId={o.id} />
    </Screen>
  );
}

function CancelSheet({ open, onClose, orderId }: { open: boolean; onClose: () => void; orderId: string }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await call(api.POST('/api/v1/app/orders/{id}/cancel', { params: { path: { id: orderId } }, body: { reason: reason.trim() } }));
      await refreshAll();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Cancel this order?">
      <Text variant="body" color={colors.muted}>
        You can cancel until Levik confirms the order.
      </Text>
      <Field label="Reason" value={reason} onChangeText={setReason} placeholder="e.g. Ordered the wrong model" error={error ?? undefined} />
      <Button title="Cancel order" variant="danger" loading={busy} disabled={reason.trim().length < 5} onPress={() => void submit()} />
    </Sheet>
  );
}

/** Picks products and quantities from the Levik catalogue and places the order. */
export function NewOrderScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, { name: string; price: number; quantity: number }>>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const products = $api.useQuery('get', '/api/v1/app/products', { params: { query: { pageSize: 100, search: search.trim() || undefined } } });

  const productsError: unknown = products.error;
  const lines = Object.entries(cart).filter(([, l]) => l.quantity > 0);
  const units = lines.reduce((s, [, l]) => s + l.quantity, 0);
  const total = lines.reduce((s, [, l]) => s + l.quantity * l.price, 0);
  const setQty = (p: { id: string; name: string; listPrice: number }, quantity: number) => setCart((c) => ({ ...c, [p.id]: { name: p.name, price: p.listPrice, quantity } }));

  const place = async () => {
    setBusy(true);
    setError(null);
    try {
      const order = await call(
        api.POST('/api/v1/app/orders', { body: { lines: lines.map(([productId, l]) => ({ productId, quantity: l.quantity })), note: note.trim() || undefined } }),
      );
      await refreshAll();
      router.replace(`/orders/${order.id}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.flex}>
      <Screen
        header={<AppHeader back eyebrow="Levik trade" title="Order stock" />}
        footer={
          units > 0 ? (
            <View style={styles.footer}>
              <View style={styles.flex}>
                <Text variant="labelLg" color={colors.inkStrong}>
                  {units} units · {lines.length} {lines.length === 1 ? 'product' : 'products'}
                </Text>
                <Text variant="headlineSm" color={colors.inkStrong}>
                  {formatINR(total)}
                </Text>
              </View>
              <Button title="Place order" icon="send" variant="gold" size="md" loading={busy} onPress={() => void place()} />
            </View>
          ) : undefined
        }
      >
        <Field value={search} onChangeText={setSearch} placeholder="Search model or product" prefix={<Icon name="search" size={20} color={colors.slate} />} accessibilityLabel="Search products" />
        {error ? (
          <Text variant="bodySm" color={colors.error}>
            {error}
          </Text>
        ) : null}
        {products.isLoading ? (
          <ListCardsSkeleton count={5} />
        ) : productsError ? (
          <ErrorState error={productsError} onRetry={() => void products.refetch()} />
        ) : (
          <FlatList
            scrollEnabled={false}
            data={products.data?.items ?? []}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.gap}
            ListEmptyComponent={<Empty icon="search_off" title="No products found" />}
            renderItem={({ item: p }) => (
              <View style={styles.productRow}>
                <ProductThumb imageUrl={p.imageUrl} size={56} label={p.name} />
                <View style={styles.flex}>
                  <Text variant="labelLg" color={colors.inkStrong} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text variant="bodySm" color={colors.muted}>
                    Model {p.modelCode} · {formatINR(p.listPrice)}
                  </Text>
                  {p.scanPoints ? <Badge label={`Plumbers earn ${p.scanPoints} pts`} tone="gold" uppercase={false} /> : null}
                </View>
                <QtyStepper value={cart[p.id]?.quantity ?? 0} onChange={(n) => setQty(p, n)} label={p.name} />
              </View>
            )}
          />
        )}
        {units > 0 ? <Field label="Note for Levik (optional)" value={note} onChangeText={setNote} placeholder="e.g. Deliver before Saturday" /> : null}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  card: { gap: space.sm, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  invoiceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  delivered: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.emeraldWash },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  total: { paddingTop: space.sm, borderTopWidth: 1, borderTopColor: colors.border },
  event: { flexDirection: 'row', gap: space.md },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: colors.gold },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
