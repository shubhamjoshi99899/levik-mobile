import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, type as typeScale } from '@/theme/tokens';
import { Text } from './text';

/** White input with a 1.5px ceramic border that turns navy with a soft ring on focus. */
export function Field({
  label,
  error,
  hint,
  prefix,
  suffix,
  style,
  ...input
}: TextInputProps & { label?: string; error?: string; hint?: string; prefix?: ReactNode; suffix?: ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="labelMd" color={colors.slate}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.shell, focused && styles.focused, error ? styles.invalid : null]}>
        {prefix}
        <TextInput
          placeholderTextColor={colors.faint}
          {...input}
          accessibilityLabel={input.accessibilityLabel ?? label}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={[styles.input, style]}
        />
        {suffix}
      </View>
      {error ? (
        <Text variant="bodySm" color={colors.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="bodySm" color={colors.muted}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  shell: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, paddingHorizontal: 14, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg },
  focused: { borderColor: colors.navy, boxShadow: '0 0 0 3px rgba(11, 30, 61, 0.08)' },
  invalid: { borderColor: colors.error },
  input: { flex: 1, ...typeScale.bodyLg, color: colors.ink, paddingVertical: 12, outlineStyle: 'none' } as never,
});
