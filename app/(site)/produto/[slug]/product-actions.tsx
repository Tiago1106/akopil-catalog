"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import type { ProductRow } from "@/lib/supabase/types";
import ptBR from "@/locales/pt-BR.json";

export function ProductActions({ product }: { product: ProductRow }) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const cartItem = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    discountPrice: product.discount_price,
    image: product.images[0] ?? null,
    maxQuantity: product.quantity,
  };

  return (
    <Button
      type="button"
      className="w-full"
      disabled={product.quantity === 0}
      onClick={() => {
        addItem(cartItem);
        openCart();
      }}
    >
      {ptBR.product.addToCart}
    </Button>
  );
}
