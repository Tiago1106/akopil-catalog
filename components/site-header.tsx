"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartCount, useCartStore } from "@/store/cart";
import ptBR from "@/locales/pt-BR.json";

export function SiteHeader() {
  const count = useCartCount();
  const openCart = useCartStore((state) => state.openCart);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background px-5 py-5 catalog:px-10">
      <Link href="/" className="text-lg font-black tracking-widest">
        AKOPIL
      </Link>
      <nav className="flex gap-8">
        <Link href="/" className="text-sm font-medium">
          {ptBR.nav.catalog}
        </Link>
        {/* "Sobre" desativado até existir a página /sobre — ver documentation.md, Status do projeto */}
      </nav>
      <button
        type="button"
        onClick={openCart}
        className="relative cursor-pointer"
        aria-label={ptBR.cart.title}
      >
        <ShoppingCart className="size-5" aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-2 flex size-[15px] items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background">
            {count}
          </span>
        )}
      </button>
    </header>
  );
}
