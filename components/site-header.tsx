import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import ptBR from "@/locales/pt-BR.json";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b px-5 py-5 catalog:px-10">
      <Link href="/" className="text-lg font-black tracking-widest">
        AKOPIL
      </Link>
      <nav className="flex gap-8">
        <Link href="/" className="text-sm font-medium">
          {ptBR.nav.catalog}
        </Link>
        <Link href="#" className="text-sm font-medium">
          {ptBR.nav.about}
        </Link>
      </nav>
      <ShoppingCart className="size-5" aria-hidden="true" />
    </header>
  );
}
