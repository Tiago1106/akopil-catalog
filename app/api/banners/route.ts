import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import type { BannerInsert } from "@/lib/supabase/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, unauthorized } = await requireUser();
  if (!user) return unauthorized;

  const body: { items?: { url: string; name: string }[] } = await request.json();
  const items = body.items ?? [];

  if (items.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const supabase = createAdminClient();

  const { data: last } = await supabase
    .from("banners")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const basePosition = (last?.position ?? -1) + 1;

  const rows: BannerInsert[] = items.map((item, index) => ({
    image_url: item.url,
    name: item.name,
    link: "",
    active: true,
    position: basePosition + index,
  }));

  const { data, error } = await supabase.from("banners").insert(rows).select("*");

  if (error) {
    console.error("[banners] create failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ items: data ?? [] });
}
