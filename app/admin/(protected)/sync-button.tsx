"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ptBR from "@/locales/pt-BR.json";

type Status = "idle" | "pending" | "success" | "error";

export function SyncButton() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSync() {
    setStatus("pending");
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      if (!response.ok) throw new Error("sync failed");
      setStatus("success");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={status === "pending"}
        className="w-full rounded-akopil bg-black px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
      >
        {status === "pending" ? ptBR.admin.dashboard.syncing : ptBR.admin.dashboard.syncButton}
      </button>
      {status === "success" && (
        <p className="text-xs text-gray-4">{ptBR.admin.dashboard.syncSuccess}</p>
      )}
      {status === "error" && (
        <p className="text-xs text-black">{ptBR.admin.dashboard.syncError}</p>
      )}
    </div>
  );
}
