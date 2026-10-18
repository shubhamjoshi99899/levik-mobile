import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { $api } from '@/api/client';
import { useSession } from '@/api/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AppHeader, Screen } from '@/components/ui/screen';
import {Empty, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { productImage } from '@/lib/product-image';
import { colors, radius, space } from '@/theme/tokens';
import { DealerCard, EarningPill, SchemeList } from './parts';
import { ProductDetailSkeleton } from '@/components/skeletons';

/** One product: what it earns the caller, live schemes, and the dealers stocking it (nearby first). */
export function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useSession();
  const plumber = session.status === 'signedIn' && session.user.role === 'plumber';
  const { data, error, isLoading, refetch, isRefetching } = $api.useQuery('get', '/api/v1/app/explore/products/{id}', { params: { path: { id } } });
  const loadError: unknown = error;

  if (isLoading)
    return (
      <Screen header={<AppHeader back eyebrow="Explore" title="Product" />}>
        <ProductDetailSkeleton />
      </Screen>
    );
  if (loadError || !data) return <ErrorState error={loadError} onRetry={() => void refetch()} />;
  const { product, dealers, city } = data;
  const source = productImage(product.imageUrl);
  const nearby = dealers.filter((d) => d.sameCity).length;

  return (
    <Screen header={<AppHeader back eyebrow={product.category} title={product.name} />} onRefresh={() => void refetch()} refreshing={isRefetching}>
      <View style={styles.hero}>
        {source ? <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={product.name} /> : <Icon name="bathtub" size={56} color={colors.onNavyMuted} />}
        <LinearGradient colors={['transparent', 'rgba(11,30,61,0.85)']} style={styles.heroShade} />
        <View style={styles.heroText}>
          <Text variant="labelSm" color={colors.goldLight}>
            Model {product.modelCode}
          </Text>
          <Text variant="headlineXl" color={colors.white}>
            {product.name}
          </Text>
        </View>
      </View>

      <Card style={styles.gap}>
        <View style={styles.rowBetween}>
          <Text variant="labelSm" color={colors.goldInk}>
            You earn
          </Text>
          <Text variant="bodySm" color={colors.muted}>
            {product.earning.basis}
          </Text>
        </View>
        <EarningPill earning={product.earning} large />
        <SchemeList earning={product.earning} />
        {plumber && product.earning.points > 0 ? <Button title="Scan this product" icon="qr_code_scanner" variant="gold" size="md" onPress={() => router.push('/scan')} /> : null}
      </Card>

      {product.description || product.dimensions || product.features.length ? (
        <Card style={styles.gap}>
          <Text variant="labelLg" color={colors.inkStrong}>
            Product details
          </Text>
          {product.description ? (
            <Text variant="body" color={colors.ink}>
              {product.description}
            </Text>
          ) : null}
          {product.dimensions ? (
            <View style={styles.row}>
              <Icon name="straighten" size={16} color={colors.slate} />
              <Text variant="bodySm" color={colors.muted}>
                {product.dimensions}
              </Text>
            </View>
          ) : null}
          {product.features.map((f) => (
            <View key={f} style={styles.row}>
              <Icon name="check_circle" size={16} color={colors.emerald} />
              <Text variant="bodySm" color={colors.ink} style={styles.flex}>
                {f}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <View>
        <Text variant="headlineMd" color={colors.inkStrong}>
          Available at {dealers.length} dealer{dealers.length === 1 ? '' : 's'}
        </Text>
        <Text variant="bodySm" color={colors.muted}>
          {city ? `${nearby} in ${city} · ` : ''}stock as reported by each dealer
        </Text>
      </View>
      {dealers.length === 0 ? (
        <Card>
          <Empty icon="storefront" title="Not in stock at any dealer" detail="Ask your nearest Levik dealer to order it in." />
        </Card>
      ) : null}
      {dealers.map((d) => (
        <DealerCard key={d.id} dealer={d} stock={{ level: d.stockLevel, quantity: d.quantity }} onPress={() => router.push({ pathname: '/dealer/[id]', params: { id: d.id } })} />
      ))}
      {!product.rewardEligible ? <Badge label="This model does not earn points" tone="neutral" uppercase={false} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero: { height: 240, borderRadius: radius.hero, overflow: 'hidden', backgroundColor: colors.slate, alignItems: 'center', justifyContent: 'center' },
  heroShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 140 },
  heroText: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg, gap: 2 },
});
