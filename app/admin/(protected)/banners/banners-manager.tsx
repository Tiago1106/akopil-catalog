"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import ptBR from "@/locales/pt-BR.json";
import { Button } from "@/components/ui/button";
import type { BannerRow } from "@/lib/supabase/types";
import { BannerList } from "./banner-list";
import { UploadDialog } from "./upload-dialog";
import { useBannerUploads } from "./use-banner-uploads";

export function BannersManager({ initialBanners }: { initialBanners: BannerRow[] }) {
  const [banners, setBanners] = useState<BannerRow[]>(initialBanners);
  const [modalOpen, setModalOpen] = useState(false);
  const uploadState = useBannerUploads();

  // Ativos sempre antes de inativos — a posição só decide a ordem dentro de cada grupo,
  // então nunca dá pra um banner desativado ficar acima de um ativo.
  const sortedBanners = banners.slice().sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.position - b.position;
  });

  async function handleUpdate(
    id: string,
    patch: Partial<Pick<BannerRow, "name" | "link" | "active" | "desktop_image_url">>,
  ) {
    const previous = banners;
    setBanners((prev) => prev.map((banner) => (banner.id === id ? { ...banner, ...patch } : banner)));

    const response = await fetch(`/api/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setBanners(previous);
      toast.error(ptBR.admin.banners.updateError);
    }
  }

  async function handleDelete(id: string) {
    const previous = banners;
    setBanners((prev) => prev.filter((banner) => banner.id !== id));

    const response = await fetch(`/api/banners/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setBanners(previous);
      toast.error(ptBR.admin.banners.deleteError);
    }
  }

  async function handleReorder(order: string[]) {
    const previous = banners;
    const byId = new Map(banners.map((banner) => [banner.id, banner]));
    setBanners(order.map((id, index) => ({ ...byId.get(id)!, position: index })));

    const response = await fetch("/api/banners/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });

    if (!response.ok) {
      setBanners(previous);
      toast.error(ptBR.admin.banners.reorderError);
    }
  }

  function handleCommitted(created: BannerRow[]) {
    if (created.length > 0) {
      setBanners((prev) => [...prev, ...created]);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">{ptBR.admin.banners.title}</h1>
          <p className="text-sm text-muted-foreground">{ptBR.admin.banners.description}</p>
        </div>
        <Button type="button" onClick={() => setModalOpen(true)}>
          <Plus />
          {ptBR.admin.banners.addButton}
        </Button>
      </div>

      <div>
        <div className="mb-3 text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          {ptBR.admin.banners.imageSizeLabel}
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-dashed p-4 text-sm sm:flex-row sm:gap-8">
          <div className="flex items-baseline gap-2">
            <span className="text-muted-foreground">{ptBR.admin.banners.imageSizeMobile}:</span>
            <span className="font-medium">{ptBR.admin.banners.imageSizeMobileValue}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-muted-foreground">{ptBR.admin.banners.imageSizeDesktop}:</span>
            <span className="font-medium">{ptBR.admin.banners.imageSizeDesktopValue}</span>
          </div>
        </div>
      </div>

      <BannerList
        banners={sortedBanners}
        onReorder={handleReorder}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      <UploadDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        uploads={uploadState.uploads}
        addFiles={uploadState.addFiles}
        updateName={uploadState.updateName}
        removeUpload={uploadState.removeUpload}
        commit={uploadState.commit}
        doneCount={uploadState.doneCount}
        onCommitted={handleCommitted}
      />
    </div>
  );
}
