import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({});
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, quantity")
    .eq("active", true)
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stockById = Object.fromEntries((data ?? []).map((row) => [row.id, row.quantity]));
  return NextResponse.json(stockById);
}
