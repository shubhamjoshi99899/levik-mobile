import { Pressable, StyleSheet, View } from 'react-native';
import type { components } from '@/api/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { callNumber, openDirections } from '@/lib/contact';
import { formatDate, formatNumber, maskMobile } from '@/lib/format';
import { colors, radius, shadows, space } from '@/theme/tokens';

export type ExploreProduct = components['schemas']['ExploreProductDto'];
export type ExploreEarning = components['schemas']['ExploreEarningDto'];
export type ExploreDealer = components['schemas']['ExploreDealerDto'];

/** "+350 pts / scan" (plumber) or "+185 pts / unit" (retailer). */
export function EarningPill({ earning, large = false }: { earning: ExploreEarning; large?: boolean }) {
  if (earning.points === 0) return <Badge label="Not reward-eligible" tone="neutral" uppercase={false} />;
  const unit = earning.basis === 'per approved scan' ? 'scan' : 'unit';
  return (
    <View style={[styles.pill, large && styles.pillLarge]}>
      <Icon name="stars" size={large ? 18 : 14} color={colors.goldInk} />
      <Text variant={large ? 'headlineSm' : 'labelLg'} color={colors.goldInk}>
        +{formatNumber(earning.points)} pts
      </Text>
      <Text variant="bodySm" color={colors.goldInk}>
        / {unit}
      </Text>
    </View>
  );
}

/** Live schemes this product counts towards. */
export function SchemeList({ earning }: { earning: ExploreEarning }) {
  if (earning.schemes.length === 0) return null;
  return (
    <View style={styles.schemes}>
      {earning.schemes.map((s) => (
        <View key={s.id} style={styles.scheme}>
          <Icon name="military_tech" size={18} color={colors.goldInk} />
          <View style={styles.flex}>
            <Text variant="labelLg" color={colors.inkStrong}>
              {s.name}
            </Text>
            <Text variant="bodySm" color={colors.muted}>
              +{formatNumber(s.incentivePoints)} bonus pts on reaching the target · ends {formatDate(s.endDate)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function StockBadge({ level, quantity }: { level: 'In Stock' | 'Low Stock'; quantity?: number }) {
  return <Badge label={quantity !== undefined ? `${level} · ${quantity}` : level} tone={level === 'In Stock' ? 'emerald' : 'warning'} uppercase={false} />;
}

/** Dealer row with nearby badge, contact actions and an optional stock line. */
export function DealerCard({
  dealer,
  stock,
  meta,
  onPress,
}: {
  dealer: ExploreDealer;
  stock?: { level: 'In Stock' | 'Low Stock'; quantity: number };
  meta?: string;
  onPress?: () => void;
}) {
  return (
    // Plain container: the name row and "Stock" open the dealer; Call/Directions are separate buttons (no nesting).
    <View style={[styles.dealer, dealer.sameCity && styles.near]}>
      <Pressable accessibilityRole={onPress ? 'link' : undefined} disabled={!onPress} onPress={onPress} style={styles.row}>
        <View style={[styles.dealerIcon, dealer.sameCity && { backgroundColor: colors.navy }]}>
          <Icon name="storefront" color={dealer.sameCity ? colors.goldLight : colors.navy} />
        </View>
        <View style={styles.flex}>
          <Text variant="labelLg" color={colors.inkStrong} numberOfLines={1}>
            {dealer.shopName}
          </Text>
          <Text variant="bodySm" color={colors.muted} numberOfLines={1}>
            {dealer.city}, {dealer.state}
            {meta ? ` · ${meta}` : ''}
          </Text>
        </View>
        {dealer.sameCity ? <Badge label="Nearby" tone="gold" icon="near_me" uppercase={false} /> : null}
      </Pressable>
      {stock ? (
        <View style={styles.rowBetween}>
          <Text variant="bodySm" color={colors.muted} numberOfLines={1} style={styles.flex}>
            {dealer.address}
          </Text>
          <StockBadge level={stock.level} quantity={stock.quantity} />
        </View>
      ) : (
        <Text variant="bodySm" color={colors.muted} numberOfLines={1}>
          {dealer.address}
        </Text>
      )}
      <View style={styles.actions}>
        <Button title="Call" icon="call" size="sm" variant="soft" style={styles.flex} onPress={() => callNumber(dealer.mobile)} />
        <Button title="Directions" icon="near_me" size="sm" variant="soft" style={styles.flex} onPress={() => openDirections(`${dealer.shopName}, ${dealer.address}, ${dealer.city}`)} />
        {onPress ? <Button title="Stock" trailingIcon="chevron_right" size="sm" style={styles.flex} onPress={onPress} /> : null}
      </View>
      <Text variant="bodySm" color={colors.faint}>
        {maskMobile(dealer.mobile)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  pill: { flexDirection: 'row', alignItems: 'baseline', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.goldWash },
  pillLarge: { paddingHorizontal: 14, paddingVertical: 8 },
  schemes: { gap: space.sm },
  scheme: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.goldWash },
  dealer: { gap: space.sm, padding: space.lg, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card },
  near: { borderColor: colors.goldLight },
  dealerIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: space.sm },
});
