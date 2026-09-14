import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/require-user";
import type { ProductOptionType } from "@/lib/supabase/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, unauthorized } = await requireUser();
  if (!user) return unauthorized;

  const body: { type?: ProductOptionType; name?: string } = await request.json();
  const type = body.type;
  const name = body.name?.trim();

  if ((type !== "material" && type !== "tag") || !name) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_options")
    .insert({ type, name })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "duplicate" }, { status: 409 });
    }
    console.error("[product-options] create failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
