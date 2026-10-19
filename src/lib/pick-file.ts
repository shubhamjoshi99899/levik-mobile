import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import type { PickedFile } from '@/api/client';

/** Camera photo; falls back to the photo library when camera permission is refused. */
export async function takePhoto(): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  const result = perm.granted
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (result.canceled) return null;
  const a = result.assets[0];
  return { uri: a.uri, name: a.fileName ?? 'photo.jpg', mimeType: a.mimeType ?? 'image/jpeg', file: a.file };
}

/**
 * Profile or shop photo: asks camera vs gallery on phones (web only has the file picker) and lets the user crop.
 * `aspect` is the crop box, e.g. [1, 1] for avatars, [4, 3] for shop fronts.
 */
export async function pickPhoto(aspect: [number, number]): Promise<PickedFile | null> {
  const source = Platform.OS === 'web' ? 'library' : await askSource();
  if (!source) return null;
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect };
  if (source === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return null;
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const a = result.assets[0];
  return { uri: a.uri, name: a.fileName ?? 'photo.jpg', mimeType: a.mimeType ?? 'image/jpeg', file: a.file };
}

function askSource(): Promise<'camera' | 'library' | null> {
  return new Promise((resolve) =>
    Alert.alert('Change photo', undefined, [
      { text: 'Take photo', onPress: () => resolve('camera') },
      { text: 'Choose from gallery', onPress: () => resolve('library') },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ], { cancelable: true, onDismiss: () => resolve(null) }),
  );
}

/** PDF or image from files (invoices). */
export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const a = result.assets[0];
  return { uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/octet-stream', file: a.file };
}
