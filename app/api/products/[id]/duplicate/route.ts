import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import { copyProductImages } from "@/lib/products/storage";
import { resolveUniqueSlug } from "@/lib/products/slug";
import type { ProductInsert } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, unauthorized } = await requireUser();
  if (!user) return unauthorized;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: source } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!source) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const newId = crypto.randomUUID();
  const images = await copyProductImages(supabase, source.images, newId);

  const { data: existingSlugs } = await supabase.from("products").select("id, slug");
  const takenSlugs = new Map((existingSlugs ?? []).map((row) => [row.slug, row.id]));
  const slug = resolveUniqueSlug(source.name, newId, takenSlugs);

  const newRow: ProductInsert = {
    id: newId,
    slug,
    name: `${source.name} (cópia)`,
    price: source.price,
    discount_price: source.discount_price,
    material: source.material,
    description: source.description,
    tags: source.tags,
    images,
    active: false,
    best_seller: false,
    quantity: 0,
  };

  const { data: created, error } = await supabase
    .from("products")
    .insert(newRow)
    .select("*")
    .single();

  if (error) {
    console.error("[products] duplicate failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ product: created });
}
