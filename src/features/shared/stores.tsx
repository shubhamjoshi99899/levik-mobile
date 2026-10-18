import { useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { $api } from '@/api/client';
import { useSession } from '@/api/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { AppHeader, Screen } from '@/components/ui/screen';
import { Empty, ErrorState, Loading } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { maskMobile } from '@/lib/format';
import { useDebounced } from '@/lib/use-debounced';
import { colors, radius, space } from '@/theme/tokens';

/** Approved, active Levik stores. "Nearby" is a city search for now (the API has no coordinates yet). */
export function StoresScreen() {
  const session = useSession();
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim(), 300);
  const me = $api.useQuery('get', '/api/v1/app/plumbers/me', {}, { enabled: session.status === 'signedIn' && session.user.role === 'plumber' });
  const { data, error, isLoading, refetch, isRefetching } = $api.useQuery('get', '/api/v1/app/stores', { params: { query: { pageSize: 50, search: term || undefined } } });
  const primaryId = me.data?.preferredRetailer?.id;
  const loadError: unknown = error;

  const directions = (address: string) => {
    const q = encodeURIComponent(address);
    void Linking.openURL(Platform.OS === 'ios' ? `maps://?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const stores = [...(data?.items ?? [])].sort((a, b) => Number(b.id === primaryId) - Number(a.id === primaryId));

  return (
    <Screen header={<AppHeader back eyebrow="Levik Luxury" title="Authorized Dealers & Stores" />} onRefresh={() => void refetch()} refreshing={isRefetching}>
      <Field value={search} onChangeText={setSearch} placeholder="Search shop, city or area" prefix={<Icon name="search" size={20} color={colors.slate} />} accessibilityLabel="Search stores" />
      <View style={styles.rowBetween}>
        <Text variant="headlineSm" color={colors.inkStrong}>
          Certified Levik hubs
        </Text>
        <Text variant="labelMd" color={colors.slate}>
          {data?.total ?? 0} stores
        </Text>
      </View>
      {isLoading ? <Loading /> : loadError ? <ErrorState error={loadError} onRetry={() => void refetch()} /> : null}
      {data && stores.length === 0 ? <Empty icon="storefront" title="No stores found" detail="Try another city or shop name." /> : null}
      {stores.map((s) => {
        const primary = s.id === primaryId;
        return (
          <Card key={s.id} style={[styles.gap, primary && styles.primary]}>
            {primary ? <Badge label="Your primary registered dealer" tone="gold" icon="star" uppercase={false} /> : null}
            <View style={styles.row}>
              <View style={styles.icon}>
                <Icon name="storefront" color={primary ? colors.goldLight : colors.navy} />
              </View>
              <View style={styles.flex}>
                <Text variant="headlineSm" color={colors.inkStrong}>
                  {s.shopName}
                </Text>
                <Text variant="bodySm" color={colors.muted}>
                  Dealer #{s.id}
                </Text>
              </View>
              <Badge label="GST verified" tone="emerald" uppercase={false} />
            </View>
            <View style={styles.line}>
              <Icon name="location_on" size={18} color={colors.slate} />
              <Text variant="body" color={colors.ink} style={styles.flex}>
                {s.address}, {s.city}, {s.state}
              </Text>
            </View>
            <View style={styles.line}>
              <Icon name="call" size={18} color={colors.slate} />
              <Text variant="body" color={colors.ink}>
                {maskMobile(s.mobile)}
              </Text>
            </View>
            <View style={styles.actions}>
              <Button title="Call Store" icon="call" variant="soft" size="md" style={styles.flex} onPress={() => void Linking.openURL(`tel:${s.mobile.replace(/[^\d+]/g, '')}`)} />
              <Button title="Directions" icon="near_me" size="md" style={styles.flex} onPress={() => directions(`${s.shopName}, ${s.address}, ${s.city}`)} />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  primary: { borderColor: colors.gold, backgroundColor: colors.goldWash },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  actions: { flexDirection: 'row', gap: space.md },
});
