import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductInsert } from "@/lib/supabase/types";
import { getAllNotionProducts } from "@/lib/notion/client";
import { isValidProduct, mapNotionPageToProduct } from "@/lib/notion/map-product";
import { syncProductImages } from "./images";
import { resolveUniqueSlug } from "./slug";

const CONCURRENCY = 5;

export type SyncResult = {
  upserted: number;
  skippedInvalid: number;
  imagesFailed: number;
  markedInactive: number;
  syncedAt: string;
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function runSync(): Promise<SyncResult> {
  const supabase = createAdminClient();

  const [notionPages, { data: existingProducts, error: existingError }] = await Promise.all([
    getAllNotionProducts(),
    supabase.from("products").select("notion_page_id, slug, active"),
  ]);

  if (existingError) {
    throw new Error(`Failed to load existing products: ${existingError.message}`);
  }

  const takenSlugs = new Map<string, string>();
  const previouslyActiveIds = new Set<string>();

  for (const product of existingProducts ?? []) {
    takenSlugs.set(product.slug, product.notion_page_id);
    if (product.active) previouslyActiveIds.add(product.notion_page_id);
  }

  const syncedAt = new Date().toISOString();
  const foundIds = new Set<string>();
  let skippedInvalid = 0;
  let imagesFailed = 0;
  let upserted = 0;

  const mappedProducts = notionPages.map(mapNotionPageToProduct);

  for (const batch of chunk(mappedProducts, CONCURRENCY)) {
    await Promise.all(
      batch.map(async (product) => {
        if (!isValidProduct(product)) {
          skippedInvalid += 1;
          return;
        }

        foundIds.add(product.notionPageId);

        const slug = resolveUniqueSlug(product.name, product.notionPageId, takenSlugs);
        const images = await syncProductImages(supabase, product.imageUrls, product.notionPageId);
        imagesFailed += product.imageUrls.length - images.length;

        const row: ProductInsert = {
          notion_page_id: product.notionPageId,
          slug,
          name: product.name,
          price: product.price,
          original_price: product.originalPrice,
          material: product.material,
          description: product.description,
          tags: product.tags,
          images,
          active: product.active,
          best_seller: product.bestSeller,
          synced_at: syncedAt,
        };

        const { error } = await supabase
          .from("products")
          .upsert(row, { onConflict: "notion_page_id" });

        if (error) {
          console.error(`[sync] failed to upsert product ${product.notionPageId}:`, error.message);
          return;
        }

        upserted += 1;
      }),
    );
  }

  const missingIds = [...previouslyActiveIds].filter((id) => !foundIds.has(id));
  let markedInactive = 0;

  if (missingIds.length > 0) {
    const { error, count } = await supabase
      .from("products")
      .update({ active: false }, { count: "exact" })
      .in("notion_page_id", missingIds);

    if (error) {
      console.error("[sync] failed to mark missing products inactive:", error.message);
    } else {
      markedInactive = count ?? missingIds.length;
    }
  }

  return { upserted, skippedInvalid, imagesFailed, markedInactive, syncedAt };
}
