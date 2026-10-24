import { keepPreviousData } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { $api, refreshAll } from '@/api/client';
import type { components } from '@/api/schema';
import { useSession } from '@/api/session';
import { DOCK_HEIGHT } from '@/components/tab-dock';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Chips, Segmented } from '@/components/ui/segmented';
import {Empty, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { formatINR } from '@/lib/format';
import { productImage } from '@/lib/product-image';
import { useCart } from '../retailer/cart';
import { AddToCart, CartBar } from '../retailer/cart-parts';
import { useDebounced } from '@/lib/use-debounced';
import { colors, radius, shadows, space } from '@/theme/tokens';
import { HomeTopBar, initialsOf } from '../shared/parts';
import { DealerCard, EarningPill, type ExploreProduct } from './parts';
import { DealerCardsSkeleton, ProductGridSkeleton } from '@/components/skeletons';

type Category = components['schemas']['ExploreProductDto']['category'];
type View_ = 'products' | 'dealers';

/** Room left under the grid so the floating cart bar never covers the last row. */
const CART_BAR_SPACE = 96;

const CATEGORIES: Category[] = ['Wall-Hung WC', 'One-Piece Western WC', 'Floor-Mounted EWC', 'Countertop Basin', 'Pedestal Basin', 'Half-Pedestal Basin', 'Wall-Hung Basin', 'Urinal', 'Cistern', 'Indian Pan', 'Kitchen Sink'];

/**
 * Explore. Plumbers: products (what they earn, how many dealers stock them) or dealers (nearby first).
 * Retailers: the catalogue with their price and incentive, to add to a stock order. They never see other
 * shops' stock.
 */
export function ExploreTab() {
  const params = useLocalSearchParams<{ view?: View_ }>();
  const session = useSession();
  const name = session.status === 'signedIn' ? session.user.name : undefined;
  const retailer = session.status === 'signedIn' && session.user.role === 'retailer';
  const { units } = useCart();
  const [view, setView] = useState<View_>(params.view === 'dealers' ? 'dealers' : 'products');
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim(), 300);

  return (
    <View style={styles.flex}>
      <HomeTopBar title="Explore" initials={initialsOf(name)} />
      <Screen bottomInset={DOCK_HEIGHT + (retailer && units > 0 ? CART_BAR_SPACE : 0)} onRefresh={() => void refreshAll()}>
        <View>
          <Text variant="headlineLg" color={colors.inkStrong}>
            {retailer ? 'Levik catalogue' : 'Where to buy, what you earn'}
          </Text>
          <Text variant="body" color={colors.muted}>
            {retailer ? 'Browse every model with your price and the points it earns you, and add it to your next stock order.' : 'Find Levik products at dealers near you and see the points each one earns.'}
          </Text>
        </View>
        {retailer ? null : <Segmented
          value={view}
          onChange={(v) => {
            setView(v);
            setSearch('');
          }}
          options={[
            { value: 'products', label: 'Products' },
            { value: 'dealers', label: 'Dealers' },
          ]}
        />}
        <Field
          value={search}
          onChangeText={setSearch}
          placeholder={view === 'products' ? 'Search model, name or category' : 'Search shop, city or area'}
          prefix={<Icon name="search" size={20} color={colors.slate} />}
          accessibilityLabel={view === 'products' ? 'Search products' : 'Search dealers'}
        />
        {view === 'products' || retailer ? <ProductsView term={term} /> : <DealersView term={term} />}
      </Screen>
      {retailer ? <FloatingCart /> : null}
    </View>
  );
}

/** Product grid with category chips (Explore, and the retailer's Order stock page). */
export function ProductsView({ term }: { term: string }) {
  const router = useRouter();
  const [category, setCategory] = useState<Category | 'all'>('all');
  const { data, error, isLoading, refetch } = $api.useQuery(
    'get',
    '/api/v1/app/explore/products',
    { params: { query: { pageSize: 50, search: term || undefined, category: category === 'all' ? undefined : category } } },
    { placeholderData: keepPreviousData },
  );
  const loadError: unknown = error;

  return (
    <>
      <Chips value={category} onChange={setCategory} options={[{ value: 'all' as const, label: 'All products' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
      {isLoading ? <ProductGridSkeleton count={6} /> : loadError ? <ErrorState error={loadError} onRetry={() => void refetch()} /> : null}
      {data && data.items.length === 0 ? <Empty icon="search_off" title="No matching products" /> : null}
      <View style={styles.grid}>
        {data?.items.map((p) => (
          <ProductTile key={p.id} product={p} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} />
        ))}
      </View>
    </>
  );
}

function ProductTile({ product, onPress }: { product: ExploreProduct; onPress: () => void }) {
  const source = productImage(product.imageUrl);
  const retailerPrice = product.listPrice;
  // The card is a plain View: the image and details open the product, and "Add" is a separate button beside
  // them (a button may not contain another button).
  return (
    <View style={styles.tile}>
      <Pressable accessibilityRole="button" accessibilityLabel={product.name} onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
        <View style={styles.tileImage}>
          {source ? <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Icon name="bathtub" size={36} color={colors.onNavyMuted} />}
          {product.earning.schemes.length ? (
            <View style={styles.tileBadge}>
              <Badge label="Scheme" tone="gold" icon="military_tech" uppercase={false} />
            </View>
          ) : null}
        </View>
        <View style={styles.tileBody}>
          <Text variant="labelSm" color={colors.slate} numberOfLines={1}>
            Model {product.modelCode}
          </Text>
          <Text variant="labelLg" color={colors.inkStrong} numberOfLines={2} style={styles.tileName}>
            {product.name}
          </Text>
          {retailerPrice != null ? (
            <Text variant="headlineSm" color={colors.inkStrong}>
              {formatINR(retailerPrice)}
            </Text>
          ) : null}
          <EarningPill earning={product.earning} />
          {retailerPrice == null ? (
            <View style={styles.availability}>
              <Icon name="storefront" size={14} color={product.dealersInStock ? colors.emeraldDeep : colors.faint} />
              <Text variant="bodySm" color={product.dealersInStock ? colors.emeraldDeep : colors.muted}>
                {product.dealersInStock ? `${product.dealersInStock} dealer${product.dealersInStock > 1 ? 's' : ''} in stock` : 'Not in stock nearby'}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      {retailerPrice != null ? (
        <View style={styles.tileAction}>
          <AddToCart product={{ productId: product.id, name: product.name, modelCode: product.modelCode, imageUrl: product.imageUrl, price: retailerPrice }} />
        </View>
      ) : null}
    </View>
  );
}

/** Retailers: the cart bar floats above the tab dock while the cart has items. */
function FloatingCart() {
  const { units } = useCart();
  if (units === 0) return null;
  return (
    <View style={[styles.floating, { bottom: DOCK_HEIGHT + space.sm }]}>
      <CartBar />
    </View>
  );
}

function DealersView({ term }: { term: string }) {
  const router = useRouter();
  const { data, error, isLoading, refetch } = $api.useQuery('get', '/api/v1/app/explore/dealers', { params: { query: { search: term || undefined } } }, { placeholderData: keepPreviousData });
  const loadError: unknown = error;
  return (
    <>
      {data?.city ? (
        <View style={styles.cityRow}>
          <Icon name="location_on" size={16} color={colors.goldInk} />
          <Text variant="bodySm" color={colors.muted}>
            Showing dealers in <Text variant="labelMd" color={colors.inkStrong}>{data.city}</Text> first
          </Text>
        </View>
      ) : null}
      {isLoading ? <DealerCardsSkeleton count={3} /> : loadError ? <ErrorState error={loadError} onRetry={() => void refetch()} /> : null}
      {data && data.dealers.length === 0 ? <Empty icon="storefront" title="No dealers found" detail="Try another city or shop name." /> : null}
      {data?.dealers.map((d) => (
        <DealerCard
          key={d.id}
          dealer={d}
          meta={`${d.productsInStock} product${d.productsInStock === 1 ? '' : 's'} in stock`}
          onPress={() => router.push({ pathname: '/dealer/[id]', params: { id: d.id } })}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: { width: '47.8%', flexGrow: 1, maxWidth: '48.5%', borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden', ...shadows.card },
  tileImage: { height: 120, backgroundColor: colors.slate, alignItems: 'center', justifyContent: 'center' },
  tileBadge: { position: 'absolute', top: 8, left: 8 },
  tileBody: { padding: space.md, gap: 6 },
  tileName: { minHeight: 36 },
  tileAction: { paddingHorizontal: space.md, paddingBottom: space.md },
  availability: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  floating: { position: 'absolute', left: space.lg, right: space.lg, padding: space.md, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, ...shadows.raised },
});
