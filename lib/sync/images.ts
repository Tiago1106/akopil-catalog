import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const BUCKET = "product-images";

export async function downloadAndUploadImage(
  supabase: SupabaseClient<Database>,
  sourceUrl: string,
  notionPageId: string,
  position: number,
): Promise<string | null> {
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      console.warn(
        `[sync] failed to download image ${position} for ${notionPageId}: HTTP ${response.status}`,
      );
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const path = `${notionPageId}/${position}.jpg`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

    if (error) {
      console.warn(`[sync] failed to upload image ${position} for ${notionPageId}:`, error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.warn(`[sync] error processing image ${position} for ${notionPageId}:`, error);
    return null;
  }
}

export async function syncProductImages(
  supabase: SupabaseClient<Database>,
  imageUrls: string[],
  notionPageId: string,
): Promise<string[]> {
  const uploaded = await Promise.all(
    imageUrls.map((url, index) =>
      downloadAndUploadImage(supabase, url, notionPageId, index + 1),
    ),
  );

  return uploaded.filter((url): url is string => url !== null);
}
