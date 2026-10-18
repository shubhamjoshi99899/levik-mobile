import { useEffect, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius as radii, shadows, space } from '@/theme/tokens';

/**
 * One shared pulse for every bone on screen, so placeholders breathe in sync instead of flickering
 * independently. Uses the native driver and stops entirely when the OS "reduce motion" setting is on.
 */
const pulse = new Animated.Value(0.55);
let running = false;

function startPulse() {
  if (running) return;
  running = true;
  void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
    if (reduce) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  });
}

/** A single placeholder block. `dark` for bones on the navy hero plinths. */
export function Bone({
  width = '100%',
  height = 12,
  radius = radii.md,
  dark = false,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  useEffect(startPulse, []);
  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[{ width, height, borderRadius: radius, backgroundColor: dark ? 'rgba(255,255,255,0.14)' : colors.surfaceHigh, opacity: pulse }, style]}
    />
  );
}

/** White card shell matching `Card`, for skeleton content. */
export function BoneCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Navy hero shell matching `HeroCard`. */
export function BoneHero({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.hero, style]}>{children}</View>;
}

/** Announces loading once to screen readers; the bones themselves are hidden from them. */
export function SkeletonGroup({ children, label = 'Loading' }: { children: ReactNode; label?: string }) {
  return (
    <View accessible accessibilityLabel={label} accessibilityRole="progressbar" accessibilityState={{ busy: true }} style={styles.group}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md, padding: space.lg, borderRadius: radii.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, ...shadows.card },
  hero: { gap: space.md, padding: space.xl, borderRadius: radii.hero, backgroundColor: colors.navy, ...shadows.raised },
  group: { gap: space.lg },
});
