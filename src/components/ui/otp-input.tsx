import { useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, shadows } from '@/theme/tokens';
import { Text } from './text';

/**
 * Six boxes backed by one hidden TextInput, so paste and SMS autofill (one-time-code) work natively.
 */
export function OtpInput({ value, onChange, length = 6, autoFocus }: { value: string; onChange: (code: string) => void; length?: number; autoFocus?: boolean }) {
  const ref = useRef<ComponentRef<typeof TextInput>>(null);
  const digits = value.padEnd(length).slice(0, length).split('');
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="One-time password" accessibilityHint="Enter the 6-digit code">
      <View style={styles.row}>
        {digits.map((d, i) => {
          const active = i === Math.min(value.length, length - 1);
          return (
            <View key={i} style={[styles.box, active && styles.active]}>
              <Text variant="headlineLg" color={colors.navy}>
                {d.trim()}
              </Text>
              {active && !d.trim() ? <View style={styles.caret} /> : null}
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus={autoFocus}
        style={styles.hidden}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: { flex: 1, aspectRatio: 0.85, maxWidth: 56, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, backgroundColor: colors.surfaceLow, borderWidth: 1, borderColor: colors.border },
  active: { backgroundColor: colors.surfaceMid, borderColor: colors.navy, ...shadows.card },
  caret: { position: 'absolute', bottom: 12, width: 16, height: 2, backgroundColor: colors.goldInk },
  // Invisible input stretched over the boxes: a tap anywhere focuses it natively (web and device).
  hidden: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.011, color: 'transparent', fontSize: 1 },
});
