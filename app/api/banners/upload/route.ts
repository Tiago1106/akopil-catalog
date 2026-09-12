import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import { deleteBannerImage, uploadBannerImage } from "@/lib/banners/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { user, unauthorized } = await requireUser();
  if (!user) return unauthorized;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "invalid file" }, { status: 400 });
  }

  try {
    const { path, url } = await uploadBannerImage(createAdminClient(), file);
    return NextResponse.json({ path, url });
  } catch (error) {
    console.error("[banners] upload failed:", error);
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { user, unauthorized } = await requireUser();
  if (!user) return unauthorized;

  const path = new URL(request.url).searchParams.get("path");
  if (path) {
    await deleteBannerImage(createAdminClient(), path);
  }

  return NextResponse.json({ ok: true });
}
