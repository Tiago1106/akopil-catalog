import ptBR from "@/locales/pt-BR.json";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
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
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-black">{ptBR.admin.dashboard.title}</h1>
        <form action={signOut}>
          <button type="submit" className="text-xs text-gray-4 underline">
            {ptBR.admin.dashboard.logout}
          </button>
        </form>
      </div>

      <dl className="space-y-3 rounded-akopil border border-gray-2 p-6 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-4">{ptBR.admin.dashboard.lastSyncLabel}</dt>
          <dd className="text-black">{lastSyncedAt ?? ptBR.admin.dashboard.neverSynced}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-4">{ptBR.admin.dashboard.activeProductsLabel}</dt>
          <dd className="text-black">{activeCount ?? 0}</dd>
        </div>
      </dl>

      <SyncButton />
    </main>
  );
}
