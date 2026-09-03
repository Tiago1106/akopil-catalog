import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { getBestSellers, getProducts } from "@/lib/products/queries";
import ptBR from "@/locales/pt-BR.json";
import { ProductCard } from "./product-card";
import { ProductGrid } from "./product-grid";

export default async function HomePage() {
  const [bestSellers, firstPage] = await Promise.all([getBestSellers(), getProducts()]);

  return (
    <>
      {bestSellers.length > 0 && (
        <section>
          <h2 className="px-5 pt-8 pb-3 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase catalog:px-10">
            {ptBR.home.bestSellers}
          </h2>
          <Carousel className="px-5 pb-2 catalog:px-10">
            <CarouselContent>
              {bestSellers.map((product) => (
                <CarouselItem key={product.id} className="basis-[300px]">
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </section>
      )}

      <h2 className="px-5 pt-8 pb-3 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase catalog:px-10">
        {ptBR.home.allProducts}
      </h2>

      <ProductGrid initialItems={firstPage.items} initialHasMore={firstPage.hasMore} />
    </>
  );
}
