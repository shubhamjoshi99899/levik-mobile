import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, gradients, radius, touch } from '@/theme/tokens';
import { Icon } from './icon';
import { Text } from './text';

type Variant = 'primary' | 'gold' | 'outline' | 'soft' | 'danger';

/**
 * Primary = midnight plinth, gold = reward/redemption CTA only, outline/soft = secondary actions.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  trailingIcon,
  loading,
  disabled,
  style,
  size = 'lg',
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: string;
  trailingIcon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: 'lg' | 'md' | 'sm';
}) {
  const fg = variant === 'primary' || variant === 'danger' ? colors.white : colors.navy;
  const height = size === 'lg' ? 56 : size === 'md' ? touch : 36;
  const inactive = disabled || loading;
  const content = (
    <View style={[styles.row, size !== 'lg' && styles.tight, { height, paddingHorizontal: size === 'lg' ? 20 : 12 }]}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} color={variant === 'primary' ? colors.goldLight : fg} /> : null}
      <Text variant={size === 'sm' ? 'labelMd' : 'labelLg'} color={fg} style={size === 'lg' ? styles.lgLabel : undefined} numberOfLines={1}>
        {title}
      </Text>
      {trailingIcon && !loading ? <Icon name={trailingIcon} size={18} color={variant === 'primary' ? colors.goldLight : fg} /> : null}
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'soft' && styles.soft,
        variant === 'danger' && styles.danger,
        { opacity: inactive ? 0.5 : pressed ? 0.88 : 1 },
        style,
      ]}
    >
      {variant === 'gold' ? (
        <LinearGradient colors={gradients.goldDeep} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fill}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.card, overflow: 'hidden' },
  fill: { borderRadius: radius.card },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  tight: { gap: 6 },
  lgLabel: { fontSize: 16 },
  primary: { backgroundColor: colors.navy },
  outline: { borderWidth: 1.5, borderColor: 'rgba(74, 96, 122, 0.3)', backgroundColor: colors.surface },
  soft: { backgroundColor: colors.surfaceMid },
  danger: { backgroundColor: colors.error },
});
