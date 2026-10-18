import { Pressable, StyleSheet, View } from 'react-native';
import { Badge, type Tone } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors, radius, space } from '@/theme/tokens';

export interface MenuItem {
  icon: string;
  title: string;
  detail?: string;
  badge?: { label: string; tone: Tone };
  value?: string;
  onPress?: () => void;
  highlight?: boolean;
}

/** Grouped settings-style list ("Trade & Operations"). Items without onPress show as coming soon. */
export function Menu({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <View style={styles.card}>
      <Text variant="labelSm" color={colors.slate} style={styles.title}>
        {title}
      </Text>
      {items.map((item, i) => (
        <Pressable
          key={item.title}
          accessibilityRole="button"
          accessibilityState={{ disabled: !item.onPress }}
          onPress={item.onPress}
          style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && item.onPress && { backgroundColor: colors.surfaceLow }]}
        >
          <View style={[styles.icon, item.highlight && { backgroundColor: colors.navy }]}>
            <Icon name={item.icon} size={20} color={item.highlight ? colors.goldLight : colors.navy} />
          </View>
          <View style={styles.flex}>
            <Text variant="labelLg" color={colors.inkStrong}>
              {item.title}
            </Text>
            {item.detail ? (
              <Text variant="bodySm" color={colors.muted}>
                {item.detail}
              </Text>
            ) : null}
          </View>
          {item.badge ? <Badge label={item.badge.label} tone={item.badge.tone} uppercase={false} /> : null}
          {item.value ? (
            <Text variant="labelMd" color={colors.goldInk}>
              {item.value}
            </Text>
          ) : null}
          {item.onPress ? (
            <Icon name="chevron_right" color={colors.faint} />
          ) : (
            <Text variant="labelSm" color={colors.faint}>
              Soon
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden' },
  title: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  icon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
});
