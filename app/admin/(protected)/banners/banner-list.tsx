"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import ptBR from "@/locales/pt-BR.json";
import type { BannerRow } from "@/lib/supabase/types";
import { BannerRowItem } from "./banner-row";

export function BannerList({
  banners,
  onReorder,
  onUpdate,
  onDelete,
}: {
  banners: BannerRow[];
  onReorder: (order: string[]) => void;
  onUpdate: (
    id: string,
    patch: Partial<Pick<BannerRow, "name" | "link" | "active" | "desktop_image_url">>,
  ) => void;
  onDelete: (id: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = banners.findIndex((banner) => banner.id === active.id);
    const newIndex = banners.findIndex((banner) => banner.id === over.id);
    const reordered = arrayMove(banners, oldIndex, newIndex);
    onReorder(reordered.map((banner) => banner.id));
  }

  if (banners.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {ptBR.admin.banners.listEmpty}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={banners.map((banner) => banner.id)} strategy={verticalListSortingStrategy}>
        <div className="overflow-hidden rounded-lg border">
          {banners.map((banner) => (
            <BannerRowItem key={banner.id} banner={banner} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
