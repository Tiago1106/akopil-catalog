import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, unauthorized } = await requireUser();
  if (!user) return unauthorized;

  const { order }: { order: string[] } = await request.json();
  const supabase = createAdminClient();

  const results = await Promise.all(
    order.map((id, index) => supabase.from("banners").update({ position: index }).eq("id", id)),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    console.error("[banners] reorder failed:", failed.error.message);
    return NextResponse.json({ error: failed.error.message }, { status: 500 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
