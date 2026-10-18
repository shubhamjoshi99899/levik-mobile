import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { $api } from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeroCard } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AppHeader, Screen } from '@/components/ui/screen';
import { Empty, ErrorState, Loading } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { callNumber, openDirections } from '@/lib/contact';
import { formatNumber, maskMobile } from '@/lib/format';
import { colors, radius, shadows, space } from '@/theme/tokens';
import { ProductThumb } from '../shared/parts';
import { EarningPill, StockBadge } from './parts';

/** One dealer: contact, and every product in stock with what it earns the caller. */
export function DealerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, error, isLoading, refetch, isRefetching } = $api.useQuery('get', '/api/v1/app/explore/dealers/{id}', { params: { path: { id } } });
  const loadError: unknown = error;

  if (isLoading) return <Loading />;
  if (loadError || !data) return <ErrorState error={loadError} onRetry={() => void refetch()} />;
  const { dealer, products } = data;
  const best = products.reduce((max, p) => Math.max(max, p.earning.points), 0);
  const withSchemes = products.filter((p) => p.earning.schemes.length > 0).length;

  return (
    <Screen header={<AppHeader back eyebrow="Authorized dealer" title={dealer.shopName} />} onRefresh={() => void refetch()} refreshing={isRefetching}>
      <HeroCard style={styles.gap}>
        <View style={styles.rowBetween}>
          <Badge label={`#${dealer.id}`} tone="soft" uppercase={false} />
          {dealer.sameCity ? <Badge label="Nearby" tone="gold" icon="near_me" uppercase={false} /> : null}
        </View>
        <Text variant="headlineLg" color={colors.white}>
          {dealer.shopName}
        </Text>
        <View style={styles.row}>
          <Icon name="location_on" size={16} color={colors.goldLight} />
          <Text variant="bodySm" color={colors.onNavyMuted} style={styles.flex}>
            {dealer.address}, {dealer.city}, {dealer.state}
          </Text>
        </View>
        <View style={styles.row}>
          <Icon name="call" size={16} color={colors.goldLight} />
          <Text variant="bodySm" color={colors.onNavyMuted}>
            {maskMobile(dealer.mobile)}
          </Text>
        </View>
        <View style={styles.stats}>
          {[
            [String(products.length), 'products in stock'],
            [best ? `+${formatNumber(best)}` : '—', 'best pts per item'],
            [String(withSchemes), 'in live schemes'],
          ].map(([value, label]) => (
            <View key={label} style={styles.stat}>
              <Text variant="headlineMd" color={colors.white}>
                {value}
              </Text>
              <Text variant="bodySm" color={colors.onNavyMuted}>
                {label}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.row}>
          <Button title="Call" icon="call" variant="gold" size="md" style={styles.flex} onPress={() => callNumber(dealer.mobile)} />
          <Button title="Directions" icon="near_me" variant="soft" size="md" style={styles.flex} onPress={() => openDirections(`${dealer.shopName}, ${dealer.address}, ${dealer.city}`)} />
        </View>
      </HeroCard>

      <Text variant="headlineMd" color={colors.inkStrong}>
        Available here
      </Text>
      {products.length === 0 ? <Empty icon="inventory_2" title="No stock reported" detail="This dealer has not reported stock yet." /> : null}
      {products.map((p) => (
        <Pressable key={p.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} style={({ pressed }) => [styles.item, pressed && { opacity: 0.9 }]}>
          <ProductThumb imageUrl={p.imageUrl} size={72} label={p.name} />
          <View style={styles.flex}>
            <Text variant="labelSm" color={colors.slate} numberOfLines={1}>
              {p.category} · {p.modelCode}
            </Text>
            <Text variant="labelLg" color={colors.inkStrong} numberOfLines={2}>
              {p.name}
            </Text>
            <View style={styles.itemMeta}>
              <EarningPill earning={p.earning} />
              <StockBadge level={p.stockLevel} quantity={p.quantity} />
            </View>
            {p.earning.schemes.map((s) => (
              <View key={s.id} style={styles.row}>
                <Icon name="military_tech" size={14} color={colors.goldInk} />
                <Text variant="bodySm" color={colors.goldInk} numberOfLines={1} style={styles.flex}>
                  {s.name}: +{formatNumber(s.incentivePoints)} bonus
                </Text>
              </View>
            ))}
          </View>
          <Icon name="chevron_right" color={colors.faint} />
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stats: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.lg, backgroundColor: 'rgba(0,0,0,0.2)' },
  stat: { flex: 1, gap: 2 },
  item: { flexDirection: 'row', gap: space.md, alignItems: 'center', padding: space.md, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
});
