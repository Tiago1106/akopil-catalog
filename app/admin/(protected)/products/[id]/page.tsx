import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProductOptions } from "@/lib/product-options/queries";
import { ProductForm } from "../product-form";

export default async function ProductFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  if (id === "new") {
    const [{ data: existingSlugs }, options] = await Promise.all([
      supabase.from("products").select("id, slug"),
      getProductOptions(),
    ]);
    return <ProductForm mode="create" existingSlugs={existingSlugs ?? []} options={options} />;
  }

  const [{ data: product }, { data: existingSlugs }, options] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("products").select("id, slug").neq("id", id),
    getProductOptions(),
  ]);

  if (!product) notFound();

  return (
    <ProductForm
      mode="edit"
      product={product}
      existingSlugs={existingSlugs ?? []}
      options={options}
    />
  );
}
