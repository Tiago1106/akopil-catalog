import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/products/format-price";
import { getProductBySlug } from "@/lib/products/queries";
import ptBR from "@/locales/pt-BR.json";
import { ProductActions } from "./product-actions";
import { ProductPhotos } from "./product-photos";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <div className="grid gap-10 px-5 py-8 catalog:grid-cols-[1.1fr_0.9fr] catalog:gap-14 catalog:px-10 catalog:py-12">
      <ProductPhotos images={product.images} alt={product.name} />

      <div>
        <div className="mb-2.5 text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          {ptBR.product.eyebrow}
        </div>
        <h1 className="mb-3.5 text-2xl font-bold">{product.name}</h1>
        <div className="mb-6 flex items-baseline gap-2.5">
          <div className="text-xl font-semibold">{formatPrice(product.price)}</div>
          {product.original_price && (
            <>
              <div className="text-base text-gray-3 line-through">
                {formatPrice(product.original_price)}
              </div>
              <Badge variant="outline">{ptBR.product.promotionBadge}</Badge>
            </>
          )}
        </div>

        {product.material && (
          <div className="flex border-t py-3.5 text-sm">
            <div className="w-28 font-medium text-muted-foreground">
              {ptBR.product.materialLabel}
            </div>
            <div>{product.material}</div>
          </div>
        )}

        {product.tags.length > 0 && (
          <div className="flex border-t py-3.5 text-sm">
            <div className="w-28 shrink-0 font-medium text-muted-foreground">
              {ptBR.product.tagsLabel}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {product.description && (
          <div className="mb-7 border-t border-b py-5 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </div>
        )}

        <ProductActions product={product} />
      </div>
    </div>
  );
}
