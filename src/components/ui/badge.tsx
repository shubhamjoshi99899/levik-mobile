import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { Icon } from './icon';
import { Text } from './text';

export type Tone = 'gold' | 'emerald' | 'navy' | 'neutral' | 'warning' | 'error' | 'soft';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  gold: { bg: colors.goldSoft, fg: colors.goldInk },
  emerald: { bg: colors.emeraldWash, fg: colors.emeraldDeep },
  navy: { bg: colors.navy, fg: colors.white },
  neutral: { bg: colors.surfaceMid, fg: colors.slate },
  warning: { bg: colors.warningWash, fg: colors.warning },
  error: { bg: colors.errorWash, fg: colors.error },
  soft: { bg: 'rgba(255,255,255,0.12)', fg: colors.white },
};

export function Badge({ label, tone = 'neutral', icon, uppercase = true }: { label: string; tone?: Tone; icon?: string; uppercase?: boolean }) {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={12} color={fg} /> : null}
      <Text variant="labelSm" color={fg} style={!uppercase && { textTransform: 'none' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
});
