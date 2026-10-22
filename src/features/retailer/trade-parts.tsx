import { Pressable, StyleSheet, View } from 'react-native';
import type { components } from '@/api/schema';
import { Badge, type Tone } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius, space } from '@/theme/tokens';

export type Order = components['schemas']['OrderResponseDto'];
export type OrderStatus = Order['status'];
export type Sale = components['schemas']['RetailerSaleResponseDto'];
export type Bill = components['schemas']['BillResponseDto'];
export type StockMovement = components['schemas']['StockMovementResponseDto'];

const ORDER_TONE: Record<OrderStatus, Tone> = { Placed: 'warning', Confirmed: 'soft', Dispatched: 'navy', Delivered: 'emerald', Cancelled: 'neutral' };
const ORDER_ICON: Record<OrderStatus, string> = { Placed: 'schedule', Confirmed: 'thumb_up', Dispatched: 'local_shipping', Delivered: 'inventory', Cancelled: 'block' };

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge label={status} tone={ORDER_TONE[status]} icon={ORDER_ICON[status]} uppercase={false} />;
}

export const ORDER_STEPS: OrderStatus[] = ['Placed', 'Confirmed', 'Dispatched', 'Delivered'];

/** Placed → Confirmed → Dispatched → Delivered, filled up to the current step. */
export function OrderProgress({ status }: { status: OrderStatus }) {
  const current = ORDER_STEPS.indexOf(status);
  return (
    <View style={styles.progress}>
      {ORDER_STEPS.map((step, i) => (
        <View key={step} style={styles.step}>
          <View style={[styles.bar, i <= current && styles.barDone]} />
          <Text variant="labelSm" color={i <= current ? colors.inkStrong : colors.faint} style={styles.stepLabel}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** − n + control for order and bill quantities. */
export function QtyStepper({ value, onChange, max = 9999, label }: { value: number; onChange: (n: number) => void; max?: number; label: string }) {
  return (
    <View style={styles.stepper} accessibilityLabel={`${label} quantity ${value}`}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Fewer ${label}`} hitSlop={6} disabled={value <= 0} onPress={() => onChange(Math.max(0, value - 1))} style={[styles.stepBtn, value <= 0 && styles.stepDisabled]}>
        <Icon name="remove" size={18} color={colors.navy} />
      </Pressable>
      <Text variant="labelLg" color={colors.inkStrong} style={styles.stepValue}>
        {value}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`More ${label}`} hitSlop={6} disabled={value >= max} onPress={() => onChange(Math.min(max, value + 1))} style={[styles.stepBtn, styles.stepAdd, value >= max && styles.stepDisabled]}>
        <Icon name="add" size={18} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', gap: space.xs },
  step: { flex: 1, gap: 6 },
  bar: { height: 5, borderRadius: radius.full, backgroundColor: colors.surfaceHigh },
  barDone: { backgroundColor: colors.gold },
  stepLabel: { textTransform: 'none' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMid },
  stepAdd: { backgroundColor: colors.navy },
  stepDisabled: { opacity: 0.35 },
  stepValue: { minWidth: 24, textAlign: 'center' },
});
