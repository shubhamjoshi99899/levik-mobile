import { File, Paths } from 'expo-file-system';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

export interface CartLine {
  productId: string;
  name: string;
  modelCode: string;
  imageUrl?: string;
  /** Catalogue price per unit. */
  price: number;
  quantity: number;
}

type Product = Omit<CartLine, 'quantity'>;

const STORAGE_KEY = 'levik.cart.v1';

/** Saved cart (a file on phones, localStorage on web), so an unfinished order survives a restart. */
function load(): CartLine[] {
  try {
    const raw = Platform.OS === 'web' ? globalThis.localStorage?.getItem(STORAGE_KEY) : new File(Paths.document, 'cart.json').exists ? new File(Paths.document, 'cart.json').textSync() : null;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartLine[]).filter((l) => l && typeof l.productId === 'string' && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

function save(next: CartLine[]) {
  try {
    const json = JSON.stringify(next);
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(STORAGE_KEY, json);
    else new File(Paths.document, 'cart.json').write(json);
  } catch {
    // Saving is best effort; the cart still works for this session.
  }
}

/**
 * The retailer's stock-order cart, shared by the catalogue, product pages and the cart screen.
 * Saved on the device and cleared once the order is placed. Prices are display only: the API prices the order.
 */
let lines: CartLine[] = load();
const listeners = new Set<() => void>();
const emit = () => {
  save(lines);
  listeners.forEach((l) => l());
};

export const cart = {
  setQuantity(product: Product, quantity: number) {
    const rest = lines.filter((l) => l.productId !== product.productId);
    const existing = lines.find((l) => l.productId === product.productId);
    lines = quantity > 0 ? (existing ? lines.map((l) => (l.productId === product.productId ? { ...l, ...product, quantity } : l)) : [...lines, { ...product, quantity }]) : rest;
    emit();
  },
  clear() {
    lines = [];
    emit();
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCart() {
  const current = useSyncExternalStore(subscribe, () => lines, () => lines);
  return {
    lines: current,
    units: current.reduce((s, l) => s + l.quantity, 0),
    total: current.reduce((s, l) => s + l.quantity * l.price, 0),
    quantityOf: (productId: string) => current.find((l) => l.productId === productId)?.quantity ?? 0,
  };
}
