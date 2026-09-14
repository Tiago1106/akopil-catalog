import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, unauthorized } = await requireUser();
  if (!user) return unauthorized;

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("product_options").delete().eq("id", id);

  if (error) {
    console.error("[product-options] delete failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
