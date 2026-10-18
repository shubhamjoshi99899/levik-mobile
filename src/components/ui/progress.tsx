import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { colors, gradients, radius } from '@/theme/tokens';

/** 6px ceramic trench with a gold fill (DESIGN.md tier rings). */
export function Progress({ value, tone = 'gold', track = colors.border, height = 6 }: { value: number; tone?: 'gold' | 'navy' | 'emerald'; track?: string; height?: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={[styles.track, { backgroundColor: track, height }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}>
      {tone === 'gold' ? (
        <LinearGradient colors={gradients.goldDeep} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${pct}%` }]} />
      ) : (
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: tone === 'navy' ? colors.navy : colors.emerald }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
});
