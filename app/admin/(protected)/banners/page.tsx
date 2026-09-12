import { createAdminClient } from "@/lib/supabase/admin";
import { BannersManager } from "./banners-manager";

export default async function AdminBannersPage() {
  const supabase = createAdminClient();
  const { data: banners } = await supabase
    .from("banners")
    .select("*")
    .order("position", { ascending: true });

  return <BannersManager initialBanners={banners ?? []} />;
}
