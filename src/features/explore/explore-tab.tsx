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
import { Empty, ErrorState, Loading } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { productImage } from '@/lib/product-image';
import { useDebounced } from '@/lib/use-debounced';
import { colors, radius, shadows, space } from '@/theme/tokens';
import { HomeTopBar, initialsOf } from '../shared/parts';
import { DealerCard, EarningPill, type ExploreProduct } from './parts';

type Category = components['schemas']['ExploreProductDto']['category'];
type View_ = 'products' | 'dealers';

const CATEGORIES: Category[] = ['Wall-Hung WC', 'One-Piece Western WC', 'Floor-Mounted EWC', 'Countertop Basin', 'Pedestal Basin', 'Half-Pedestal Basin', 'Wall-Hung Basin', 'Urinal', 'Cistern', 'Indian Pan', 'Kitchen Sink'];

/** Explore: browse products (what they earn, how many dealers stock them) or dealers (nearby first). */
export function ExploreTab() {
  const params = useLocalSearchParams<{ view?: View_ }>();
  const session = useSession();
  const name = session.status === 'signedIn' ? session.user.name : undefined;
  const [view, setView] = useState<View_>(params.view === 'dealers' ? 'dealers' : 'products');
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim(), 300);

  return (
    <View style={styles.flex}>
      <HomeTopBar title="Explore" initials={initialsOf(name)} />
      <Screen bottomInset={DOCK_HEIGHT} onRefresh={() => void refreshAll()}>
        <View>
          <Text variant="headlineLg" color={colors.inkStrong}>
            Where to buy, what you earn
          </Text>
          <Text variant="body" color={colors.muted}>
            Find Levik products at dealers near you and see the points each one earns.
          </Text>
        </View>
        <Segmented
          value={view}
          onChange={(v) => {
            setView(v);
            setSearch('');
          }}
          options={[
            { value: 'products', label: 'Products' },
            { value: 'dealers', label: 'Dealers' },
          ]}
        />
        <Field
          value={search}
          onChangeText={setSearch}
          placeholder={view === 'products' ? 'Search model, name or category' : 'Search shop, city or area'}
          prefix={<Icon name="search" size={20} color={colors.slate} />}
          accessibilityLabel={view === 'products' ? 'Search products' : 'Search dealers'}
        />
        {view === 'products' ? <ProductsView term={term} /> : <DealersView term={term} />}
      </Screen>
    </View>
  );
}

function ProductsView({ term }: { term: string }) {
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
      {isLoading ? <Loading /> : loadError ? <ErrorState error={loadError} onRetry={() => void refetch()} /> : null}
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
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={product.name} onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9 }]}>
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
        <EarningPill earning={product.earning} />
        <View style={styles.availability}>
          <Icon name="storefront" size={14} color={product.dealersInStock ? colors.emeraldDeep : colors.faint} />
          <Text variant="bodySm" color={product.dealersInStock ? colors.emeraldDeep : colors.muted}>
            {product.dealersInStock ? `${product.dealersInStock} dealer${product.dealersInStock > 1 ? 's' : ''} in stock` : 'Not in stock nearby'}
          </Text>
        </View>
      </View>
    </Pressable>
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
      {isLoading ? <Loading /> : loadError ? <ErrorState error={loadError} onRetry={() => void refetch()} /> : null}
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
  availability: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
