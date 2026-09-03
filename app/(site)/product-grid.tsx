"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "./product-card";
import type { ProductRow } from "@/lib/supabase/types";
import ptBR from "@/locales/pt-BR.json";

export function ProductGrid({
  initialItems,
  initialHasMore,
}: {
  initialItems: ProductRow[];
  initialHasMore: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/products?offset=${items.length}`);
      if (!response.ok) throw new Error("failed to load more products");
      const data: { items: ProductRow[]; hasMore: boolean } = await response.json();
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [items.length]);

  useEffect(() => {
    if (!hasMore || isLoading || error) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, error, loadMore]);

  if (items.length === 0) {
    return (
      <p className="px-5 py-16 text-center text-sm text-muted-foreground catalog:px-10">
        {ptBR.home.grid.empty}
      </p>
    );
  }

  return (
    <div className="px-5 py-8 catalog:px-10">
      <div className="grid grid-cols-2 gap-4 catalog:grid-cols-4 catalog:gap-6">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore && !error && (
        <div
          ref={sentinelRef}
          className="py-6 text-center text-[11px] tracking-wider text-gray-3 uppercase"
        >
          {ptBR.home.grid.loadingMore}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-2 py-6">
          <p className="text-xs text-muted-foreground">{ptBR.home.grid.loadMoreError}</p>
          <button
            type="button"
            onClick={loadMore}
            className="cursor-pointer text-xs font-semibold underline"
          >
            {ptBR.home.grid.retry}
          </button>
        </div>
      )}
    </div>
  );
}
