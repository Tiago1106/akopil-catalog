import { formatPrice } from "@/lib/products/format-price";
import type { CartItem } from "@/store/cart";
import ptBR from "@/locales/pt-BR.json";

const SEPARATOR = "────────────────────";

function itemBlock(item: CartItem, index: number): string {
  const label = ptBR.cart.whatsapp.itemLabel.replace("{n}", String(index + 1));
  const name = item.quantity > 1 ? `${item.quantity}x ${item.name}` : item.name;
  const lineTotal = item.price * item.quantity;
  const priceLine = item.originalPrice
    ? `~${formatPrice(item.originalPrice * item.quantity)}~ → ${formatPrice(lineTotal)}`
    : formatPrice(lineTotal);

  return `*${label}*\n${name}\n${priceLine}`;
}

export function buildCheckoutMessage(items: CartItem[]): string {
  const total = items.reduce((sum, item) => sum + (item.originalPrice ?? item.price) * item.quantity, 0);
  const discountedTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasDiscount = total !== discountedTotal;

  const totalsBlock = hasDiscount
    ? `${ptBR.cart.whatsapp.total}: ${formatPrice(total)}\n${ptBR.cart.whatsapp.discountedTotal}: ${formatPrice(discountedTotal)}`
    : `${ptBR.cart.whatsapp.value}: ${formatPrice(discountedTotal)}`;

  const sections = [ptBR.cart.whatsapp.greeting, ...items.map(itemBlock), totalsBlock];

  return sections.join(`\n\n${SEPARATOR}\n\n`);
}

export function buildCheckoutUrl(items: CartItem[], phoneNumber: string): string {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(buildCheckoutMessage(items))}`;
}
