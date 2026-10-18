import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { errorMessage } from '@/api/errors';
import { colors, space } from '@/theme/tokens';
import { Button } from './button';
import { Icon } from './icon';
import { Text } from './text';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.navy} />
      <Text variant="bodySm" color={colors.muted}>
        {label}
      </Text>
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Icon name="cloud_off" size={32} color={colors.slate} />
      <Text variant="labelLg" color={colors.navy}>
        Something went wrong
      </Text>
      <Text variant="bodySm" color={colors.muted} style={styles.message}>
        {errorMessage(error)}
      </Text>
      {onRetry ? <Button title="Try again" icon="refresh" variant="outline" size="md" onPress={onRetry} /> : null}
    </View>
  );
}

export function Empty({ icon = 'inbox', title, detail }: { icon?: string; title: string; detail?: string }) {
  return (
    <View style={styles.center}>
      <Icon name={icon} size={28} color={colors.faint} />
      <Text variant="labelLg" color={colors.navy}>
        {title}
      </Text>
      {detail ? (
        <Text variant="bodySm" color={colors.muted} style={styles.message}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: space.xxl },
  message: { textAlign: 'center', maxWidth: 280 },
});
