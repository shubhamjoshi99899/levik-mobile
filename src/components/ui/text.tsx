import { Text as RNText, type TextProps } from 'react-native';
import { colors, type as typeScale, type TypeVariant } from '@/theme/tokens';

export function Text({ variant = 'body', color = colors.ink, style, ...props }: TextProps & { variant?: TypeVariant; color?: string }) {
  return <RNText {...props} style={[typeScale[variant], { color }, style]} />;
}

/** Tabular numbers keep point and rupee columns from jumping as values change. */
export const tabular = { fontVariant: ['tabular-nums'] as ('tabular-nums')[] };
