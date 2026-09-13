import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const BUCKET = "product-images";

export async function uploadProductImage(
  supabase: SupabaseClient<Database>,
  file: File,
  productId: string,
): Promise<{ path: string; url: string }> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export function productImagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

export async function deleteProductImages(
  supabase: SupabaseClient<Database>,
  urls: string[],
): Promise<void> {
  const paths = urls.map(productImagePathFromUrl).filter((path): path is string => path !== null);
  if (paths.length === 0) return;
  await supabase.storage.from(BUCKET).remove(paths);
}

export async function deleteProductImageByPath(
  supabase: SupabaseClient<Database>,
  path: string,
): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function copyProductImages(
  supabase: SupabaseClient<Database>,
  urls: string[],
  newProductId: string,
): Promise<string[]> {
  const newUrls: string[] = [];

  for (const url of urls) {
    const oldPath = productImagePathFromUrl(url);
    if (!oldPath) continue;

    const ext = oldPath.split(".").pop() || "jpg";
    const newPath = `${newProductId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).copy(oldPath, newPath);
    if (error) continue;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(newPath);
    newUrls.push(data.publicUrl);
  }

  return newUrls;
}
