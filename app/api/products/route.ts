import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getProducts, PAGE_SIZE } from "@/lib/products/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import type { ProductInsert } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const { items, hasMore } = await getProducts({ limit: PAGE_SIZE, offset });
  return NextResponse.json({ items, hasMore });
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, unauthorized } = await requireUser();
  if (!user) return unauthorized;

  const body: { items?: ProductInsert[] } = await request.json();
  const items = body.items ?? [];

  if (items.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const { data, error } = await createAdminClient().from("products").insert(items).select("*");

  if (error) {
    console.error("[products] create failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ items: data ?? [] });
}
