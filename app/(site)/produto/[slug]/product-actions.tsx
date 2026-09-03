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
    originalPrice: product.original_price,
    image: product.images[0] ?? null,
  };

  return (
    <Button
      type="button"
      className="w-full"
      onClick={() => {
        addItem(cartItem);
        openCart();
      }}
    >
      {ptBR.product.addToCart}
    </Button>
  );
}
