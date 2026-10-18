import { StyleSheet, View , Alert, Platform } from 'react-native';
import { $api, api, call, refreshAll } from '@/api/client';
import { errorMessage } from '@/api/errors';
import { Badge, type Tone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AppHeader, Screen } from '@/components/ui/screen';
import {Empty, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { formatNumber, formatRelative } from '@/lib/format';
import { colors, radius, space } from '@/theme/tokens';
import { ListCardsSkeleton } from '@/components/skeletons';

const STATUS_TONE: Record<string, Tone> = {
  Requested: 'gold',
  Approved: 'neutral',
  Processing: 'neutral',
  Dispatched: 'neutral',
  Delivered: 'emerald',
  Cancelled: 'error',
  Failed: 'error',
};

/** The user's reward requests and their fulfilment status. Requested ones can be cancelled. */
export function RedemptionsScreen() {
  const { data, error, isLoading, refetch, isRefetching } = $api.useQuery('get', '/api/v1/app/redemptions', { params: { query: { pageSize: 50 } } });
  const loadError: unknown = error;

  const cancel = (id: string) => {
    const run = async () => {
      try {
        await call(api.POST('/api/v1/app/redemptions/{id}/cancel', { params: { path: { id } } }));
        void refreshAll();
      } catch (e) {
        if (Platform.OS === 'web') globalThis.alert?.(errorMessage(e));
        else Alert.alert('Could not cancel', errorMessage(e));
      }
    };
    if (Platform.OS === 'web') void run();
    else Alert.alert('Cancel this request?', 'Reserved points are released back to your balance.', [{ text: 'Keep' }, { text: 'Cancel request', style: 'destructive', onPress: () => void run() }]);
  };

  return (
    <Screen header={<AppHeader back eyebrow="Rewards" title="My Redemptions" />} onRefresh={() => void refetch()} refreshing={isRefetching}>
      {isLoading ? <ListCardsSkeleton count={4} /> : loadError ? <ErrorState error={loadError} onRetry={() => void refetch()} /> : null}
      {data && data.items.length === 0 ? <Empty icon="redeem" title="No reward requests yet" detail="Redeem a reward from the marketplace to see it here." /> : null}
      {data?.items.map((r) => (
        <Card key={r.id} style={styles.gap}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Icon name={r.rewardType === 'Digital' ? 'redeem' : 'local_shipping'} color={colors.navy} />
            </View>
            <View style={styles.flex}>
              <Text variant="labelLg" color={colors.inkStrong}>
                {r.rewardName}
              </Text>
              <Text variant="bodySm" color={colors.muted}>
                {r.id} • {formatRelative(r.requestedAt)}
              </Text>
            </View>
            <Text variant="headlineSm" color={colors.error}>
              −{formatNumber(r.pointsCost)}
            </Text>
          </View>
          <View style={styles.rowBetween}>
            <Badge label={r.status} tone={STATUS_TONE[r.status] ?? 'neutral'} uppercase={false} />
            {r.trackingNumber ? (
              <Text variant="bodySm" color={colors.slate}>
                {r.courierName} · {r.trackingNumber}
              </Text>
            ) : null}
            {r.voucherCode ? (
              <Text variant="labelLg" color={colors.emeraldDeep}>
                Code: {r.voucherCode}
              </Text>
            ) : null}
          </View>
          {r.cancelReason ? (
            <Text variant="bodySm" color={colors.error}>
              {r.cancelReason}
            </Text>
          ) : null}
          {r.status === 'Requested' ? <Button title="Cancel request" variant="outline" size="sm" onPress={() => cancel(r.id)} /> : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, flexWrap: 'wrap' },
  icon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center' },
});
