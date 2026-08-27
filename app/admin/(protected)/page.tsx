import ptBR from "@/locales/pt-BR.json";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncButton } from "./sync-button";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ data: lastSync }, { count: activeCount }] = await Promise.all([
    supabase
      .from("products")
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
  ]);

  const lastSyncedAt = lastSync?.synced_at
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(lastSync.synced_at))
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">{ptBR.admin.dashboard.title}</h1>
        <SyncButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>{ptBR.admin.dashboard.lastSyncLabel}</CardDescription>
            <CardTitle className="text-2xl">{lastSyncedAt ?? "-"}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{ptBR.admin.dashboard.activeProductsLabel}</CardDescription>
            <CardTitle className="text-2xl">{activeCount ?? "-"}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
