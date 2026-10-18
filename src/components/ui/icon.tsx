import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { colors } from '@/theme/tokens';

type GlyphName = ComponentProps<typeof MaterialIcons>['name'];

/** Material Symbols names from the Stitch designs that MaterialIcons spells differently. */
const ALIASES: Record<string, GlyphName> = {
  featured_seasonal_and_gifts: 'card-giftcard',
  shield_lock: 'enhanced-encryption',
};

/** Accepts Material Symbols names as written in the designs (snake_case), e.g. "qr_code_scanner". */
export function Icon({ name, size = 22, color = colors.navy }: { name: string; size?: number; color?: string }) {
  const glyph = ALIASES[name] ?? (name.replace(/_/g, '-') as GlyphName);
  return <MaterialIcons name={glyph} size={size} color={color} />;
}
