import { Linking } from 'react-native';
import { fileSource } from '@/api/client';

/**
 * Opens a generated PDF (purchase invoice, customer bill) from its signed link. Phones hand it to the
 * browser or PDF viewer, which can also share or save it.
 */
export function openDocument(url?: string | null): void {
  const source = fileSource(url);
  if (source) void Linking.openURL(source);
}
