import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import { bannerImagePathFromUrl, deleteBannerImage } from "@/lib/banners/storage";
import type { BannerInsert } from "@/lib/supabase/types";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, unauthorized } = await requireUser();
  if (!user) return unauthorized;

  const { id } = await params;
  const patch: Partial<Pick<BannerInsert, "name" | "link" | "active" | "desktop_image_url">> =
    await request.json();

  const supabase = createAdminClient();
  let previousDesktopImageUrl: string | null = null;

  if ("desktop_image_url" in patch) {
    const { data: banner } = await supabase
      .from("banners")
      .select("desktop_image_url")
      .eq("id", id)
      .maybeSingle();
    previousDesktopImageUrl = banner?.desktop_image_url ?? null;
  }

  const { error } = await supabase.from("banners").update(patch).eq("id", id);

  if (error) {
    console.error("[banners] update failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (
    previousDesktopImageUrl &&
    previousDesktopImageUrl !== patch.desktop_image_url
  ) {
    const path = bannerImagePathFromUrl(previousDesktopImageUrl);
    if (path) await deleteBannerImage(supabase, path);
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

  const { data: banner } = await supabase
    .from("banners")
    .select("image_url, desktop_image_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("banners").delete().eq("id", id);

  if (error) {
    console.error("[banners] delete failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const imageUrl of [banner?.image_url, banner?.desktop_image_url]) {
    if (!imageUrl) continue;
    const path = bannerImagePathFromUrl(imageUrl);
    if (path) await deleteBannerImage(supabase, path);
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
