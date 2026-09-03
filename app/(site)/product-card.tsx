import Image from "next/image";
import Link from "next/link";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/products/format-price";
import type { ProductRow } from "@/lib/supabase/types";
import ptBR from "@/locales/pt-BR.json";

export function ProductCard({ product }: { product: ProductRow }) {
  const thumbnail = product.images[0];

  return (
    <Link href={`/produto/${product.slug}`} className="block">
      <AspectRatio
        ratio={1}
        className="mb-2.5 overflow-hidden rounded-lg border bg-muted"
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={product.name}
            fill
            sizes="(min-width: 860px) 25vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-3">
            {ptBR.home.grid.noImage}
          </div>
        )}
      </AspectRatio>
      <div className="mb-1 text-sm font-medium">{product.name}</div>
      {product.tags.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {product.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <div className="text-sm text-muted-foreground">
        {product.original_price && (
          <span className="mr-1.5 text-gray-3 line-through">
            {formatPrice(product.original_price)}
          </span>
        )}
        {formatPrice(product.price)}
      </div>
    </Link>
  );
}
