import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductForm } from "../product-form";

export default async function ProductFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  if (id === "new") {
    const { data: existingSlugs } = await supabase.from("products").select("id, slug");
    return <ProductForm mode="create" existingSlugs={existingSlugs ?? []} />;
  }

  const [{ data: product }, { data: existingSlugs }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("products").select("id, slug").neq("id", id),
  ]);

  if (!product) notFound();

  return <ProductForm mode="edit" product={product} existingSlugs={existingSlugs ?? []} />;
}
