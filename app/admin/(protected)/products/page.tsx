import { createAdminClient } from "@/lib/supabase/admin";
import { ProductsManager } from "./products-manager";

const PAGE_SIZES = [30, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 30;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const pageSize = PAGE_SIZES.includes(Number(params.pageSize) as (typeof PAGE_SIZES)[number])
    ? Number(params.pageSize)
    : DEFAULT_PAGE_SIZE;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * pageSize;

  const supabase = createAdminClient();
  const [{ data: products, count }, { data: allBasics }] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1),
    supabase.from("products").select("id, name, slug"),
  ]);

  return (
    <ProductsManager
      key={`${page}-${pageSize}`}
      initialProducts={products ?? []}
      allProducts={allBasics ?? []}
      page={page}
      pageSize={pageSize}
      totalCount={count ?? 0}
    />
  );
}
