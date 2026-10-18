import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '@/theme/tokens';
import { Icon } from './ui/icon';
import { Text } from './ui/text';

/** Marks screens that are UI-only in the POC (no backend yet). */
export function PreviewBanner({ text }: { text: string }) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Icon name="science" size={18} color={colors.warning} />
      <Text variant="bodySm" color={colors.inkStrong} style={styles.flex}>
        <Text variant="labelMd" color={colors.warning}>
          Preview ·{' '}
        </Text>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', gap: space.sm, alignItems: 'center', padding: space.md, borderRadius: radius.lg, backgroundColor: colors.warningWash, borderWidth: 1, borderColor: '#FCD34D' },
  flex: { flex: 1 },
});
