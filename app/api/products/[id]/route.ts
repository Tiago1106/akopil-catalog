import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import { deleteProductImages } from "@/lib/products/storage";
import type { ProductInsert } from "@/lib/supabase/types";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, unauthorized } = await requireUser();
  if (!user) return unauthorized;

  const { id } = await params;
  const patch: Partial<
    Pick<
      ProductInsert,
      | "name"
      | "price"
      | "discount_price"
      | "material"
      | "description"
      | "tags"
      | "images"
      | "active"
      | "best_seller"
      | "quantity"
    >
  > = await request.json();

  const supabase = createAdminClient();
  let previousImages: string[] | null = null;

  if ("images" in patch) {
    const { data: product } = await supabase
      .from("products")
      .select("images")
      .eq("id", id)
      .maybeSingle();
    previousImages = product?.images ?? null;
  }

  const { error } = await supabase.from("products").update(patch).eq("id", id);

  if (error) {
    console.error("[products] update failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (previousImages && patch.images) {
    const removed = previousImages.filter((url) => !patch.images!.includes(url));
    if (removed.length > 0) await deleteProductImages(supabase, removed);
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, unauthorized } = await requireUser();
  if (!user) return unauthorized;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: product } = await supabase
    .from("products")
    .select("images")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    console.error("[products] delete failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (product?.images?.length) {
    await deleteProductImages(supabase, product.images);
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
