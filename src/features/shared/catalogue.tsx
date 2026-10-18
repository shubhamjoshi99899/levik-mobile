import { keepPreviousData } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { $api } from '@/api/client';
import type { components } from '@/api/schema';
import { useSession } from '@/api/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { AppHeader, Screen } from '@/components/ui/screen';
import { Chips } from '@/components/ui/segmented';
import { Empty, ErrorState, Loading } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { formatNumber } from '@/lib/format';
import { productImage } from '@/lib/product-image';
import { useDebounced } from '@/lib/use-debounced';
import { colors, radius, space } from '@/theme/tokens';

type Category = components['schemas']['AppProductResponseDto']['category'];
const CATEGORIES: Category[] = ['Wall-Hung WC', 'One-Piece Western WC', 'Floor-Mounted EWC', 'Countertop Basin', 'Pedestal Basin', 'Half-Pedestal Basin', 'Wall-Hung Basin', 'Urinal', 'Cistern', 'Indian Pan', 'Kitchen Sink'];

export function CatalogueScreen() {
  const router = useRouter();
  const session = useSession();
  const plumber = session.status === 'signedIn' && session.user.role === 'plumber';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const term = useDebounced(search.trim(), 300);
  const { data, error, isLoading, refetch, isRefetching } = $api.useQuery(
    'get',
    '/api/v1/app/products',
    { params: { query: { pageSize: 100, search: term || undefined, category: category === 'all' ? undefined : category } } },
    { placeholderData: keepPreviousData },
  );
  const schemes = $api.useQuery('get', '/api/v1/app/schemes');
  const offer = (schemes.data ?? []).find((s) => s.status === 'Active');
  const loadError: unknown = error;

  return (
    <Screen header={<AppHeader back eyebrow="Sanitaryware" title="Product Catalogue" />} onRefresh={() => void refetch()} refreshing={isRefetching}>
      <Field value={search} onChangeText={setSearch} placeholder="Search model, name or category" prefix={<Icon name="search" size={20} color={colors.slate} />} accessibilityLabel="Search products" />
      <Chips value={category} onChange={setCategory} options={[{ value: 'all' as const, label: 'All products' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />

      {offer ? (
        <View style={styles.offer}>
          <View style={styles.rowBetween}>
            <Badge label="Active scheme" tone="gold" icon="stars" />
            <Icon name="chevron_right" color={colors.goldInk} />
          </View>
          <Text variant="headlineSm" color={colors.inkStrong}>
            {offer.name}
          </Text>
          <Text variant="bodySm" color={colors.ink}>
            {offer.description}
          </Text>
          <Text variant="labelMd" color={colors.goldInk}>
            +{formatNumber(offer.incentivePoints)} bonus pts on reaching the target
          </Text>
        </View>
      ) : null}

      <View style={styles.rowBetween}>
        <Text variant="headlineSm" color={colors.inkStrong}>
          Vitreous Ceramic
        </Text>
        <Text variant="labelMd" color={colors.slate}>
          {data?.total ?? 0} models listed
        </Text>
      </View>

      {isLoading ? <Loading /> : loadError ? <ErrorState error={loadError} onRetry={() => void refetch()} /> : null}
      {data && data.items.length === 0 ? <Empty icon="search_off" title="No matching models" /> : null}
      {data?.items.map((p) => {
        const source = productImage(p.imageUrl);
        return (
          <Card key={p.id} padded={false} style={styles.card}>
            <View style={styles.image}>
              {source ? <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={p.name} /> : <Icon name="bathtub" size={48} color={colors.onNavyMuted} />}
              {p.scanPoints > 0 ? (
                <View style={styles.imageBadge}>
                  <Badge label="Reward eligible" tone="gold" icon="star" uppercase={false} />
                </View>
              ) : null}
            </View>
            <View style={styles.body}>
              <Text variant="labelSm" color={colors.slate}>
                Model {p.modelCode} · {p.category}
              </Text>
              <Text variant="headlineSm" color={colors.inkStrong}>
                {p.name}
              </Text>
              <Text variant="bodySm" color={colors.muted} numberOfLines={2}>
                {[p.dimensions, ...p.features.slice(0, 2)].filter(Boolean).join(' • ') || p.description}
              </Text>
              <View style={styles.accrual}>
                <View style={styles.flex}>
                  <Text variant="labelSm" color={colors.slate}>
                    Plumber accrual
                  </Text>
                  <View style={styles.row}>
                    <Icon name="stars" size={16} color={colors.goldInk} />
                    <Text variant="labelLg" color={colors.inkStrong}>
                      {p.scanPoints > 0 ? `${formatNumber(p.scanPoints)} reward pts` : 'Not reward-eligible'}
                    </Text>
                  </View>
                </View>
                <Badge label="In stock" tone="emerald" uppercase={false} />
              </View>
              {plumber && p.scanPoints > 0 ? <Button title="Scan Carton QR" icon="qr_code_scanner" variant="soft" size="md" onPress={() => router.push('/scan')} /> : null}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  offer: { gap: 6, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.goldWash, borderWidth: 1, borderColor: colors.goldLight },
  card: { overflow: 'hidden' },
  image: { height: 200, backgroundColor: colors.slate, alignItems: 'center', justifyContent: 'center' },
  imageBadge: { position: 'absolute', top: space.md, left: space.md },
  body: { padding: space.lg, gap: space.sm },
  accrual: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.surfaceLow },
});
