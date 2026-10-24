import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatINR } from '@/lib/format';
import { colors, radius, space } from '@/theme/tokens';
import { cart, useCart, type CartLine } from './cart';
import { QtyStepper } from './trade-parts';

type Product = Omit<CartLine, 'quantity'>;

/** "Add" until the product is in the cart, then a − n + stepper. */
export function AddToCart({ product, large = false }: { product: Product; large?: boolean }) {
  const { quantityOf } = useCart();
  const quantity = quantityOf(product.productId);
  if (quantity === 0) {
    return large ? (
      <Button title="Add to cart" icon="add_shopping_cart" variant="gold" onPress={() => cart.setQuantity(product, 1)} />
    ) : (
      <Pressable accessibilityRole="button" accessibilityLabel={`Add ${product.name} to cart`} onPress={() => cart.setQuantity(product, 1)} style={({ pressed }) => [styles.add, pressed && { opacity: 0.85 }]}>
        <Icon name="add_shopping_cart" size={16} color={colors.white} />
        <Text variant="labelMd" color={colors.white}>
          Add
        </Text>
      </Pressable>
    );
  }
  return (
    <View style={[styles.inCart, large && styles.inCartLarge]}>
      {large ? (
        <Text variant="labelLg" color={colors.inkStrong} style={styles.flex}>
          In your cart
        </Text>
      ) : null}
      <QtyStepper value={quantity} label={product.name} onChange={(n) => cart.setQuantity(product, n)} />
    </View>
  );
}

/** Sticky footer: units, total and a button to the cart. Hidden while the cart is empty. */
export function CartBar() {
  const router = useRouter();
  const { units, total } = useCart();
  if (units === 0) return null;
  return (
    <View style={styles.bar}>
      <View style={styles.barIcon}>
        <Icon name="shopping_cart" color={colors.goldLight} />
      </View>
      <View style={styles.flex}>
        <Text variant="labelLg" color={colors.inkStrong}>
          {units} {units === 1 ? 'unit' : 'units'} in cart
        </Text>
        <Text variant="headlineSm" color={colors.inkStrong}>
          {formatINR(total)}
        </Text>
      </View>
      <Button title="View cart" trailingIcon="arrow_forward" variant="gold" size="md" onPress={() => router.push('/orders/cart')} />
    </View>
  );
}

/** Header button with the number of units in the cart. */
export function CartButton() {
  const router = useRouter();
  const { units } = useCart();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Cart, ${units} units`} hitSlop={8} onPress={() => router.push('/orders/cart')} style={styles.cartBtn}>
      <Icon name="shopping_cart" color={colors.navy} />
      {units > 0 ? (
        <View style={styles.count}>
          <Text variant="labelSm" color={colors.white} style={styles.countText}>
            {units > 99 ? '99+' : units}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: radius.full, backgroundColor: colors.navy },
  inCart: { alignItems: 'center' },
  inCartLarge: { flexDirection: 'row', padding: space.md, borderRadius: radius.lg, backgroundColor: colors.goldWash },
  bar: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  barIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  cartBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMid },
  count: { position: 'absolute', top: 2, right: 0, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  countText: { textTransform: 'none' },
});
