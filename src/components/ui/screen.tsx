import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '@/theme/tokens';
import { BrandMark } from './brand-mark';
import { Icon } from './icon';
import { Text } from './text';

/** Scrollable page on the alabaster floor with optional pull-to-refresh and a sticky footer. */
export function Screen({
  children,
  header,
  footer,
  onRefresh,
  refreshing = false,
  padded = true,
  bottomInset = 0,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  padded?: boolean;
  /** Extra bottom space so content clears the floating tab dock. */
  bottomInset?: number;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[padded && styles.padded, { paddingBottom: space.xxl + bottomInset }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} /> : undefined}
      >
        {children}
      </ScrollView>
      {footer ? <SafeAreaView edges={['bottom']} style={styles.footer}>{footer}</SafeAreaView> : null}
    </SafeAreaView>
  );
}

/** Top bar: back arrow (or brand plate) + eyebrow/title + trailing actions. */
export function AppHeader({ title, eyebrow, back, brand, right }: { title: string; eyebrow?: string; back?: boolean; brand?: boolean; right?: ReactNode }) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.iconBtn}>
          <Icon name="arrow_back" color={colors.navy} />
        </Pressable>
      ) : null}
      {brand ? <BrandMark compact /> : null}
      <View style={styles.titles}>
        {eyebrow ? (
          <Text variant="labelSm" color={colors.goldInk}>
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="headlineSm" color={colors.navy} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

/** Section title row with an optional trailing action label. */
export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.section}>
      <Text variant="headlineSm" color={colors.navy}>
        {title}
      </Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text variant="labelMd" color={colors.goldInk}>
            {action.toUpperCase()}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  padded: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.lg },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  titles: { flex: 1 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
