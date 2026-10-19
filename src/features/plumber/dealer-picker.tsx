import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { $api } from '@/api/client';
import type { components } from '@/api/schema';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useDebounced } from '@/lib/use-debounced';
import { colors, gradients, radius, space } from '@/theme/tokens';

export type Store = components['schemas']['StoreResponseDto'];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/**
 * Shop "image": stores have no photos in the API yet, so each shop gets a branded navy tile with its
 * initials (gold for the plumber's registered dealer). Swap for a real photo when the API stores one.
 */
export function ShopImage({ name, primary = false, size = 52 }: { name: string; primary?: boolean; size?: number }) {
  return (
    <LinearGradient colors={primary ? [colors.goldInk, colors.gold] : gradients.navy} style={[styles.shop, { width: size, height: size, borderRadius: size / 4 }]}>
      <Icon name="storefront" size={size * 0.3} color={primary ? colors.white : colors.goldLight} />
      <Text variant="labelSm" color={colors.white} style={styles.shopInitials}>
        {initials(name)}
      </Text>
    </LinearGradient>
  );
}

function StoreRow({ store, primary, selected }: { store: Store; primary: boolean; selected: boolean }) {
  return (
    <View style={styles.storeRow}>
      <ShopImage name={store.shopName} primary={primary} />
      <View style={styles.flex}>
        <Text variant="labelLg" color={colors.inkStrong} numberOfLines={2}>
          {store.shopName}
        </Text>
        <Text variant="bodySm" color={colors.muted} numberOfLines={2}>
          {store.address}, {store.city}, {store.state}
        </Text>
        {primary ? (
          <View style={styles.badgeRow}>
            <Badge label="Your dealer" tone="gold" icon="verified" uppercase={false} />
          </View>
        ) : null}
      </View>
      {selected ? <Icon name="check_circle" color={colors.emerald} /> : null}
    </View>
  );
}

/**
 * Proof-of-sale dealer selector: a field showing the chosen shop (image, name, full address) that opens a
 * searchable sheet. `value` undefined = no dealer.
 */
export function DealerPicker({ value, primaryId, onChange }: { value?: string; primaryId?: string; onChange: (id: string | undefined) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim(), 250);
  const { data } = $api.useQuery('get', '/api/v1/app/stores', {
    params: { query: { pageSize: 50, search: term || undefined } },
  });
  // Keep the selected store resolvable even when the search no longer lists it.
  const { data: all } = $api.useQuery('get', '/api/v1/app/stores', {
    params: { query: { pageSize: 50 } },
  });
  const selected = all?.items.find((s) => s.id === value) ?? data?.items.find((s) => s.id === value);
  const stores = [...(data?.items ?? [])].sort((a, b) => Number(b.id === primaryId) - Number(a.id === primaryId));

  const close = () => {
    setOpen(false);
    setSearch('');
  };
  const choose = (id: string | undefined) => {
    onChange(id);
    close();
  };

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={selected ? `Dealer: ${selected.shopName}. Change` : 'Choose dealer'} onPress={() => setOpen(true)} style={({ pressed }) => [styles.field, pressed && { opacity: 0.9 }]}>
        {selected ? (
          <View style={styles.flex}>
            <StoreRow store={selected} primary={selected.id === primaryId} selected={false} />
          </View>
        ) : (
          <View style={[styles.flex, styles.storeRow]}>
            <View style={styles.noDealer}>
              <Icon name="store" color={colors.slate} />
            </View>
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.inkStrong}>
                No dealer selected
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                Tap to choose where the product was bought
              </Text>
            </View>
          </View>
        )}
        <Icon name="expand_more" color={colors.slate} />
      </Pressable>

      <Sheet open={open} onClose={close} title="Where was it bought?">
        <Field value={search} onChangeText={setSearch} placeholder="Search shop, city or area" prefix={<Icon name="search" size={20} color={colors.slate} />} accessibilityLabel="Search dealers" />
        <FlatList
          data={stores}
          keyExtractor={(s) => s.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: !value }} onPress={() => choose(undefined)} style={styles.option}>
              <View style={styles.storeRow}>
                <View style={styles.noDealer}>
                  <Icon name="block" color={colors.slate} />
                </View>
                <Text variant="labelLg" color={colors.inkStrong} style={styles.flex}>
                  No dealer / not sure
                </Text>
                {!value ? <Icon name="check_circle" color={colors.emerald} /> : null}
              </View>
            </Pressable>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: item.id === value }}
              onPress={() => choose(item.id)}
              style={({ pressed }) => [styles.option, item.id === value && styles.optionSelected, pressed && { opacity: 0.85 }]}
            >
              <StoreRow store={item} primary={item.id === primaryId} selected={item.id === value} />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text variant="bodySm" color={colors.muted} style={styles.empty}>
              No dealers match “{search}”.
            </Text>
          }
        />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shop: { alignItems: 'center', justifyContent: 'center', gap: 1 },
  shopInitials: { letterSpacing: 1, textTransform: 'none' },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  badgeRow: { flexDirection: 'row', marginTop: space.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  noDealer: {
    width: 52,
    height: 52,
    borderRadius: 13,
    backgroundColor: colors.surfaceMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { maxHeight: 420 },
  option: { padding: space.sm, borderRadius: radius.lg },
  optionSelected: { backgroundColor: colors.emeraldWash },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  empty: { textAlign: 'center', paddingVertical: space.lg },
});
