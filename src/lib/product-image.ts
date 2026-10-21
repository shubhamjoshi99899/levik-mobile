import type { ImageSource } from 'expo-image';
import { fileSource } from '@/api/client';

/**
 * Catalogue photos are bundled with the app (the API stores web paths like /images/products/1012.jpg that the
 * admin portal serves). Map the file name to the bundled asset.
 */
const PRODUCT_IMAGES: Record<string, ImageSource> = {
  '1005.jpg': require('@/assets/products/1005.jpg'),
  '1008.jpg': require('@/assets/products/1008.jpg'),
  '101.jpg': require('@/assets/products/101.jpg'),
  '1012.jpg': require('@/assets/products/1012.jpg'),
  '1018.jpg': require('@/assets/products/1018.jpg'),
  '1020.jpg': require('@/assets/products/1020.jpg'),
  '103.jpg': require('@/assets/products/103.jpg'),
  '105.jpg': require('@/assets/products/105.jpg'),
  '108.jpg': require('@/assets/products/108.jpg'),
  '201.jpg': require('@/assets/products/201.jpg'),
  '205.jpg': require('@/assets/products/205.jpg'),
  '206.jpg': require('@/assets/products/206.jpg'),
  '303-pd.jpg': require('@/assets/products/303-pd.jpg'),
  '515.jpg': require('@/assets/products/515.jpg'),
  '6002.jpg': require('@/assets/products/6002.jpg'),
  '9001.jpg': require('@/assets/products/9001.jpg'),
  '9002.jpg': require('@/assets/products/9002.jpg'),
  'cistern-pvc.jpg': require('@/assets/products/cistern-pvc.jpg'),
  'orissa-23.jpg': require('@/assets/products/orissa-23.jpg'),
  'sink-quartz.jpg': require('@/assets/products/sink-quartz.jpg'),
  'urinal-flat-back.jpg': require('@/assets/products/urinal-flat-back.jpg'),
};

/**
 * Bundled catalogue photo by file name; otherwise an image uploaded in the admin, which the API returns as a
 * signed link relative to its origin ("/api/v1/files/…"), or an absolute URL.
 */
export function productImage(imageUrl?: string | null): ImageSource | undefined {
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith('/api/')) return { uri: fileSource(imageUrl) };
  if (/^https?:\/\//i.test(imageUrl)) return { uri: imageUrl };
  return PRODUCT_IMAGES[imageUrl.split('/').pop() ?? ''];
}
