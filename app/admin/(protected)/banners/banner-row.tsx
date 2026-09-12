"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Monitor, Trash2, X } from "lucide-react";
import ptBR from "@/locales/pt-BR.json";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { BannerRow } from "@/lib/supabase/types";

const DEBOUNCE_MS = 450;

function useDebouncedField(value: string, onCommit: (value: string) => void) {
  const [prevValue, setPrevValue] = useState(value);
  const [local, setLocal] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (value !== prevValue) {
    setPrevValue(value);
    setLocal(value);
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  function set(next: string) {
    setLocal(next);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onCommit(next), DEBOUNCE_MS);
  }

  return [local, set] as const;
}

function linkTag(link: string): string {
  if (!link) return ptBR.admin.banners.linkTagNone;
  if (link.startsWith("http")) return ptBR.admin.banners.linkTagExternal;
  return ptBR.admin.banners.linkTagProduct;
}

type BannerPatch = Partial<Pick<BannerRow, "name" | "link" | "active" | "desktop_image_url">>;

function DesktopImageSlot({
  banner,
  onUpdate,
}: {
  banner: BannerRow;
  onUpdate: (id: string, patch: BannerPatch) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/banners/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("upload failed");
      const data: { url: string } = await response.json();
      onUpdate(banner.id, { desktop_image_url: data.url });
    } catch {
      toast.error(ptBR.admin.banners.updateError);
    } finally {
      setIsUploading(false);
    }
  }

  if (banner.desktop_image_url) {
    return (
      <div
        className="group relative h-10 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted"
        title={ptBR.admin.banners.desktopImageLabel}
      >
        <Image src={banner.desktop_image_url} alt="" fill sizes="64px" className="object-cover" />
        <button
          type="button"
          onClick={() => onUpdate(banner.id, { desktop_image_url: null })}
          aria-label={ptBR.admin.banners.desktopImageRemove}
          className="absolute inset-0 flex items-center justify-center bg-foreground/60 text-background opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={isUploading}
      title={ptBR.admin.banners.desktopImageAdd}
      aria-label={ptBR.admin.banners.desktopImageAdd}
      className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed text-gray-3 hover:border-foreground hover:text-foreground disabled:opacity-50"
    >
      {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Monitor className="size-3.5" />}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = "";
        }}
      />
    </button>
  );
}

export function BannerRowItem({
  banner,
  onUpdate,
  onDelete,
}: {
  banner: BannerRow;
  onUpdate: (id: string, patch: BannerPatch) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.id,
  });

  const [name, setName] = useDebouncedField(banner.name, (value) => onUpdate(banner.id, { name: value }));
  const [link, setLink] = useDebouncedField(banner.link ?? "", (value) => onUpdate(banner.id, { link: value }));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3.5 border-b bg-card p-3 last:border-b-0 ${isDragging ? "opacity-40" : ""} ${
        banner.active ? "" : "opacity-60"
      }`}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab text-gray-3 active:cursor-grabbing"
        aria-label="Arraste para reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        <div className="size-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
          <Image
            src={banner.image_url}
            alt={name}
            width={40}
            height={40}
            className="size-full object-cover"
          />
        </div>
        <DesktopImageSlot banner={banner} onUpdate={onUpdate} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={ptBR.admin.banners.namePlaceholder}
          className="rounded-md border border-transparent px-1 py-0.5 text-sm font-medium hover:border-border focus:border-ring focus:bg-muted focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <input
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder={ptBR.admin.banners.linkPlaceholder}
            className="h-7 min-w-0 flex-1 rounded-lg border border-input bg-muted px-2.5 text-xs focus:border-ring focus:outline-none"
          />
          <span className="shrink-0 rounded-lg border px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
            {linkTag(link)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3.5">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            {banner.active ? ptBR.admin.banners.active : ptBR.admin.banners.inactive}
          </span>
          <Switch
            checked={banner.active}
            onCheckedChange={(checked) => onUpdate(banner.id, { active: checked })}
          />
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label={ptBR.admin.banners.delete}>
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{ptBR.admin.banners.deleteConfirm.title}</AlertDialogTitle>
              <AlertDialogDescription>{ptBR.admin.banners.deleteConfirm.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{ptBR.admin.banners.deleteConfirm.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(banner.id)}>
                {ptBR.admin.banners.deleteConfirm.confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
