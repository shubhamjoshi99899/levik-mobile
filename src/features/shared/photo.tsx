import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { fileSource, uploadFile, type UploadPurpose } from '@/api/client';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { pickPhoto } from '@/lib/pick-file';
import { colors } from '@/theme/tokens';
import { initialsOf } from './parts';

/**
 * Round profile photo with an initials fallback. With `onPress` it shows a camera button to change it.
 * `badge` is an extra overlay (e.g. a verified tick) that the caller positions.
 * `url` is the API's signed link (photoUrl); it stays the same all day, so expo-image serves it from cache.
 */
export function Avatar({
  url,
  name,
  size = 72,
  busy = false,
  onPress,
  badge,
  style,
}: {
  url?: string;
  name: string;
  size?: number;
  busy?: boolean;
  onPress?: () => void;
  badge?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const source = fileSource(url);
  const body = (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, borderWidth: size > 48 ? 3 : 2 }, style]}>
      {source ? (
        <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
      ) : (
        <Text variant={size > 48 ? 'headlineLg' : 'labelLg'} color={colors.goldLight}>
          {initialsOf(name)}
        </Text>
      )}
      {busy ? (
        <View style={[StyleSheet.absoluteFill, styles.busy]}>
          <ActivityIndicator color={colors.white} />
        </View>
      ) : null}
    </View>
  );
  if (!onPress) return <View>{body}{badge}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={source ? 'Change profile photo' : 'Add profile photo'} onPress={onPress} disabled={busy}>
      {body}
      {badge}
      <View style={styles.camera}>
        <Icon name="photo_camera" size={14} color={colors.navy} />
      </View>
    </Pressable>
  );
}

/**
 * Pick → upload → save, for profile and shop photos. `save` receives the new upload key (image ID) and should
 * PATCH the profile; errors surface through `error`.
 */
export function usePhotoChange(purpose: UploadPurpose, aspect: [number, number], save: (key: string) => Promise<unknown>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const change = async () => {
    const file = await pickPhoto(aspect);
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await save(await uploadFile(file, purpose));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the photo. Try again.');
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, change: () => void change() };
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', borderColor: colors.goldLight, overflow: 'hidden' },
  busy: { backgroundColor: 'rgba(11,30,61,0.55)', alignItems: 'center', justifyContent: 'center' },
  camera: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
