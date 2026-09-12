"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, Upload, X } from "lucide-react";
import ptBR from "@/locales/pt-BR.json";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import type { BannerRow } from "@/lib/supabase/types";
import type { UploadEntry } from "./use-banner-uploads";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDialog({
  open,
  onOpenChange,
  uploads,
  addFiles,
  updateName,
  removeUpload,
  commit,
  doneCount,
  onCommitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploads: UploadEntry[];
  addFiles: (files: FileList | File[]) => void;
  updateName: (id: string, name: string) => void;
  removeUpload: (id: string) => void;
  commit: () => Promise<BannerRow[]>;
  doneCount: number;
  onCommitted: (created: BannerRow[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleConfirm() {
    setIsCommitting(true);
    try {
      const created = await commit();
      onCommitted(created);
      onOpenChange(false);
    } catch {
      toast.error(ptBR.admin.banners.updateError);
    } finally {
      setIsCommitting(false);
    }
  }

  const confirmLabel =
    doneCount === 0
      ? ptBR.admin.banners.modal.confirmEmpty
      : (doneCount === 1
          ? ptBR.admin.banners.modal.confirmSingular
          : ptBR.admin.banners.modal.confirmPlural
        ).replace("{n}", String(doneCount));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{ptBR.admin.banners.modal.title}</DialogTitle>
          <DialogDescription>{ptBR.admin.banners.modal.description}</DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              addFiles(event.dataTransfer.files);
            }}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed px-5 py-7 text-center text-sm text-muted-foreground transition-colors ${
              isDragging ? "border-foreground bg-muted text-foreground" : "bg-muted"
            }`}
          >
            <Upload className="mb-1 size-5 text-gray-3" />
            <div>
              <strong className="font-bold text-foreground">{ptBR.admin.banners.modal.dropzoneHint}</strong>
            </div>
            <div className="text-xs text-gray-3">{ptBR.admin.banners.modal.dropzoneFormats}</div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => {
                if (event.target.files) addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </div>

          {uploads.length > 0 && (
            <AttachmentGroup className="flex-col overflow-visible">
              {uploads.map((entry) => (
                <Attachment key={entry.id} state={entry.status} className="w-full">
                  <AttachmentMedia variant="image">
                    {/* eslint-disable-next-line @next/next/no-img-element -- preview de blob: local, ainda não hospedado */}
                    <img src={entry.previewUrl} alt="" />
                  </AttachmentMedia>
                  <AttachmentContent>
                    {entry.status === "done" ? (
                      <Input
                        value={entry.name}
                        onChange={(event) => updateName(entry.id, event.target.value)}
                        placeholder={ptBR.admin.banners.namePlaceholder}
                        className="h-7"
                      />
                    ) : (
                      <AttachmentTitle>{entry.name}</AttachmentTitle>
                    )}
                    <AttachmentDescription>
                      {formatSize(entry.file.size)}
                      {entry.status === "uploading" && ` · ${ptBR.admin.banners.modal.uploading}`}
                      {entry.status === "done" && ` · ${ptBR.admin.banners.modal.done}`}
                      {entry.status === "error" && ` · ${ptBR.admin.banners.modal.error}`}
                    </AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction
                      aria-label={ptBR.admin.banners.delete}
                      onClick={() => removeUpload(entry.id)}
                    >
                      {entry.status === "done" ? <Trash2 /> : <X />}
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ))}
            </AttachmentGroup>
          )}
        </div>

        <DialogFooter>
          <Button type="button" disabled={doneCount === 0 || isCommitting} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
