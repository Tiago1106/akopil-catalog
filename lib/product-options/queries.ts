import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductOptionRow } from "@/lib/supabase/types";

export async function getProductOptions(): Promise<ProductOptionRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_options")
    .select("*")
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
