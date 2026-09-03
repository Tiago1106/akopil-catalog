"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { buildCheckoutUrl } from "@/lib/cart/checkout-message";
import { formatPrice } from "@/lib/products/format-price";
import { useCartStore, useCartSubtotal } from "@/store/cart";
import ptBR from "@/locales/pt-BR.json";

export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const openCart = useCartStore((state) => state.openCart);
  const items = useCartStore((state) => state.items);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const subtotal = useCartSubtotal();

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const checkoutUrl =
    whatsappNumber && items.length > 0 ? buildCheckoutUrl(items, whatsappNumber) : null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? openCart() : closeCart())}>
      <SheetContent className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader className="border-b">
          <SheetTitle>{ptBR.cart.title}</SheetTitle>
          <SheetDescription className="sr-only">{ptBR.cart.description}</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-4 text-sm text-muted-foreground">
            {ptBR.cart.empty}
          </p>
        ) : (
          <div className="flex-1 overflow-y-auto px-4">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-3.5 border-b py-4.5">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-[9px] text-gray-3">
                      {ptBR.home.grid.noImage}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-center gap-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      onClick={() => decrementItem(item.productId)}
                    >
                      <Minus />
                    </Button>
                    <span className="w-4 text-center text-xs">{item.quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      onClick={() => incrementItem(item.productId)}
                    >
                      <Plus />
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="w-fit cursor-pointer text-[11px] text-gray-3 underline"
                  >
                    {ptBR.cart.remove}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <SheetFooter className="border-t">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">{ptBR.cart.subtotal}</span>
            <span className="font-bold">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex gap-2.5">
            <Button type="button" variant="outline" className="flex-1" onClick={closeCart}>
              {ptBR.cart.continueShopping}
            </Button>
            {checkoutUrl ? (
              <Button asChild className="flex-1">
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                  {ptBR.cart.checkout}
                </a>
              </Button>
            ) : (
              <Button type="button" className="flex-1" disabled>
                {ptBR.cart.checkout}
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
