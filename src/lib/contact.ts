import { Linking, Platform } from 'react-native';

export function callNumber(phone: string) {
  void Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
}

/** Opens the platform maps app searching for the shop (stores have no coordinates yet). */
export function openDirections(query: string) {
  const q = encodeURIComponent(query);
  void Linking.openURL(Platform.OS === 'ios' ? `maps://?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`);
}
