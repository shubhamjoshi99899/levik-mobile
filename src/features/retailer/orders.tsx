import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { $api, api, call, refreshAll } from '@/api/client';
import { errorMessage } from '@/api/errors';
import { ListCardsSkeleton } from '@/components/skeletons';
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
import { useDebounced } from '@/lib/use-debounced';
import { colors, radius, space } from '@/theme/tokens';
import { ProductsView } from '../explore/explore-tab';
import { ProductThumb } from '../shared/parts';
import { cart, useCart } from './cart';
import { CartBar, CartButton } from './cart-parts';
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

/** Order stock: the Explore-style catalogue with prices, points and add-to-cart, plus a sticky cart bar. */
export function NewOrderScreen() {
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim(), 300);
  return (
    <Screen header={<AppHeader back eyebrow="Levik trade" title="Order stock" right={<CartButton />} />} footer={<CartBar />}>
      <View style={styles.intro}>
        <Icon name="local_shipping" color={colors.goldLight} />
        <View style={styles.flex}>
          <Text variant="labelLg" color={colors.white}>
            Catalogue prices · delivered to your shop
          </Text>
          <Text variant="bodySm" color={colors.onNavyMuted}>
            Delivered orders are added to your stock automatically, with a purchase invoice.
          </Text>
        </View>
      </View>
      <Field value={search} onChangeText={setSearch} placeholder="Search model, name or category" prefix={<Icon name="search" size={20} color={colors.slate} />} accessibilityLabel="Search products" />
      <ProductsView term={term} />
    </Screen>
  );
}

/** Review the cart, add a note and place the order. */
export function CartScreen() {
  const router = useRouter();
  const { lines, units, total } = useCart();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const place = async () => {
    setBusy(true);
    setError(null);
    try {
      const order = await call(api.POST('/api/v1/app/orders', { body: { lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })), note: note.trim() || undefined } }));
      cart.clear();
      await refreshAll();
      router.replace(`/orders/${order.id}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<AppHeader back eyebrow="Order stock" title="Your cart" />}
      footer={
        units > 0 ? (
          <View style={styles.footer}>
            <View style={styles.flex}>
              <Text variant="bodySm" color={colors.muted}>
                {units} {units === 1 ? 'unit' : 'units'} · {lines.length} {lines.length === 1 ? 'product' : 'products'}
              </Text>
              <Text variant="headlineMd" color={colors.inkStrong}>
                {formatINR(total)}
              </Text>
            </View>
            <Button title="Place order" icon="send" variant="gold" size="md" loading={busy} onPress={() => void place()} />
          </View>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <Card>
          <Empty icon="remove_shopping_cart" title="Your cart is empty" detail="Add products from the catalogue to build a stock order." />
          <Button title="Browse catalogue" icon="storefront" variant="soft" onPress={() => router.replace('/orders/new')} />
        </Card>
      ) : (
        <>
          {lines.map((line) => (
            <View key={line.productId} style={styles.cartLine}>
              <ProductThumb imageUrl={line.imageUrl} size={64} label={line.name} />
              <View style={styles.flex}>
                <Text variant="labelLg" color={colors.inkStrong} numberOfLines={2}>
                  {line.name}
                </Text>
                <Text variant="bodySm" color={colors.muted}>
                  Model {line.modelCode} · {formatINR(line.price)} each
                </Text>
                <View style={styles.rowBetween}>
                  <QtyStepper value={line.quantity} label={line.name} onChange={(n) => cart.setQuantity(line, n)} />
                  <Text variant="labelLg" color={colors.inkStrong}>
                    {formatINR(line.price * line.quantity)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          <Card style={styles.gap}>
            <Field label="Note for Levik (optional)" value={note} onChangeText={setNote} placeholder="e.g. Deliver before Saturday" multiline />
            <View style={styles.rowBetween}>
              <Text variant="body" color={colors.muted}>
                Total at catalogue prices
              </Text>
              <Text variant="headlineSm" color={colors.inkStrong}>
                {formatINR(total)}
              </Text>
            </View>
            <Text variant="bodySm" color={colors.muted}>
              Levik confirms the order and delivers it. You can cancel until it is confirmed.
            </Text>
          </Card>
          {error ? (
            <Text variant="bodySm" color={colors.error}>
              {error}
            </Text>
          ) : null}
        </>
      )}
    </Screen>
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
  intro: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.navy },
  cartLine: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
