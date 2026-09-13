import ptBR from "@/locales/pt-BR.json";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const [{ count: totalCount }, { count: activeCount }, { count: outOfStockCount }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("active", true),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("active", true)
        .eq("quantity", 0),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-bold">{ptBR.admin.dashboard.title}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{ptBR.admin.dashboard.totalProductsLabel}</CardDescription>
            <CardTitle className="text-2xl">{totalCount ?? "-"}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{ptBR.admin.dashboard.activeProductsLabel}</CardDescription>
            <CardTitle className="text-2xl">{activeCount ?? "-"}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{ptBR.admin.dashboard.outOfStockLabel}</CardDescription>
            <CardTitle className="text-2xl">{outOfStockCount ?? "-"}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
