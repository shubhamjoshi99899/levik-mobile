import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, radius, shadows } from '@/theme/tokens';
import { Text } from './text';

/** Alabaster pill track with an elevated white active segment. */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onChange(o.value)} style={[styles.seg, active && styles.active]}>
            <Text variant="labelMd" color={active ? colors.navy : colors.muted} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Horizontally scrolling filter chips (categories, ledger filters). */
export function Chips<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (value: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => onChange(o.value)} style={[styles.chip, active && styles.chipActive]}>
            <Text variant="labelMd" color={active ? colors.white : colors.navy}>
              {o.label}
            </Text>
            {o.count !== undefined ? (
              <View style={[styles.count, active && styles.countActive]}>
                <Text variant="labelSm" color={active ? colors.navy : colors.slate}>
                  {o.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: radius.lg, padding: 4 },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.md },
  active: { backgroundColor: colors.surface, ...shadows.card },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: radius.full, backgroundColor: colors.surfaceLow, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  count: { backgroundColor: colors.surface, borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  countActive: { backgroundColor: colors.goldLight },
});
