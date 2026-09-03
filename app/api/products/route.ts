import { NextResponse } from "next/server";
import { getProducts, PAGE_SIZE } from "@/lib/products/queries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const { items, hasMore } = await getProducts({ limit: PAGE_SIZE, offset });
  return NextResponse.json({ items, hasMore });
}
