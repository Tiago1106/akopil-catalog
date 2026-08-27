"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ptBR from "@/locales/pt-BR.json";

export function SyncButton() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSync() {
    setIsSyncing(true);
    toast(ptBR.admin.dashboard.syncStarted);
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
    <Button type="button" onClick={handleSync} disabled={isSyncing}>
      {isSyncing && <Loader2 className="animate-spin" />}
      {isSyncing ? ptBR.admin.dashboard.syncing : ptBR.admin.dashboard.syncButton}
    </Button>
  );
}
