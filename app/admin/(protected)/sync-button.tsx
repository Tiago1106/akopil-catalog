"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ptBR from "@/locales/pt-BR.json";

export function SyncButton() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSync() {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      if (!response.ok) throw new Error("sync failed");
      toast.success(ptBR.admin.dashboard.syncSuccess);
      router.refresh();
    } catch {
      toast.error(ptBR.admin.dashboard.syncError);
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={isSyncing}
      className="w-full rounded-akopil bg-black px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
    >
      {isSyncing ? ptBR.admin.dashboard.syncing : ptBR.admin.dashboard.syncButton}
    </button>
  );
}
