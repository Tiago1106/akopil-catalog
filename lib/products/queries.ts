import { createClient } from "@/lib/supabase/server";
import type { ProductRow } from "@/lib/supabase/types";

export const PAGE_SIZE = 16;

export async function getBestSellers(): Promise<ProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .eq("best_seller", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export type ProductPage = {
  items: ProductRow[];
  hasMore: boolean;
};

export async function getProducts({
  limit = PAGE_SIZE,
  offset = 0,
}: { limit?: number; offset?: number } = {}): Promise<ProductPage> {
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const items = data ?? [];
  const hasMore = count !== null ? offset + items.length < count : items.length === limit;

  return { items, hasMore };
}
