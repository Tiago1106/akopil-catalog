"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import ptBR from "@/locales/pt-BR.json";

const MAX_IMAGES = 4;

export function ImageManager({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadOne(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);
      const response = await fetch("/api/products/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("upload failed");
      const data: { url: string } = await response.json();
      return data.url;
    } catch {
      return null;
    }
  }

  async function handleFiles(fileList: FileList) {
    const remainingSlots = MAX_IMAGES - images.length;
    const files = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remainingSlots);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded = await Promise.all(files.map(uploadOne));
      const urls = uploaded.filter((url): url is string => url !== null);
      if (urls.length > 0) onChange([...images, ...urls]);
      if (urls.length < files.length) toast.error(ptBR.admin.products.updateError);
    } finally {
      setIsUploading(false);
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-wrap gap-3">
      {images.map((url, index) => (
        <div
          key={url}
          className="group relative size-20 shrink-0 overflow-hidden rounded-lg border bg-muted"
        >
          <Image src={url} alt="" fill sizes="80px" className="object-cover" />
          <button
            type="button"
            onClick={() => removeAt(index)}
            aria-label={ptBR.admin.products.delete}
            className="absolute inset-0 flex items-center justify-center bg-foreground/60 text-background opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}

      {images.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-dashed text-gray-3 hover:border-foreground hover:text-foreground disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="animate-spin" /> : <Plus />}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => {
              if (event.target.files && event.target.files.length > 0) {
                handleFiles(event.target.files);
              }
              event.target.value = "";
            }}
          />
        </button>
      )}
    </div>
  );
}
