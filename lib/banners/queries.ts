import { createClient } from "@/lib/supabase/server";
import type { BannerRow } from "@/lib/supabase/types";

export async function getBanners(): Promise<BannerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("active", true)
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
