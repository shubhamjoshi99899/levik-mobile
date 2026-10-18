import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '@/theme/tokens';
import { Text } from './text';

/** Levik Luxury lock-up (leaves cupped inside a crescent), same mark as the admin portal. */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.plate, compact && styles.compact]} accessibilityLabel="Levik Luxury">
      <Svg viewBox="0 0 40 40" width={compact ? 18 : 22} height={compact ? 18 : 22}>
        <Path d="M30 6a16 16 0 1 0 4 22" fill="none" stroke={colors.goldLight} strokeWidth={2} strokeLinecap="round" />
        <Path d="M20 10c3 3 3 8 0 11-3-3-3-8 0-11Z" fill={colors.goldLight} />
        <Path d="M12 15c4 0 7 3 7.5 7-4 0-7-3-7.5-7Z" fill={colors.goldLight} opacity={0.85} />
        <Path d="M28 15c-4 0-7 3-7.5 7 4 0 7-3 7.5-7Z" fill={colors.goldLight} opacity={0.85} />
        <Path d="M10 25c3 2.5 6.5 3.5 10 3.5s7-1 10-3.5" fill="none" stroke={colors.goldLight} strokeWidth={2} strokeLinecap="round" />
      </Svg>
      <View>
        <Text variant="labelLg" color={colors.white} style={styles.word}>
          LEVIK
        </Text>
        {!compact ? (
          <Text variant="labelSm" color={colors.goldLight} style={styles.sub}>
            Luxury
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.navy, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  compact: { paddingVertical: 4 },
  word: { letterSpacing: 2.4, lineHeight: 16 },
  sub: { fontSize: 7, letterSpacing: 2, lineHeight: 9 },
});
