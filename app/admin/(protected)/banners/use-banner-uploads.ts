"use client";

import { useCallback, useRef, useState } from "react";
import type { BannerRow } from "@/lib/supabase/types";

export type UploadEntry = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  status: "uploading" | "done" | "error";
  path?: string;
  url?: string;
};

function cleanName(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, "");
  const spaced = withoutExt.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return spaced.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

export function useBannerUploads() {
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const controllersRef = useRef(new Map<string, AbortController>());

  const uploadOne = useCallback(async (entry: UploadEntry) => {
    const controller = new AbortController();
    controllersRef.current.set(entry.id, controller);

    const formData = new FormData();
    formData.append("file", entry.file);

    try {
      const response = await fetch("/api/banners/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("upload failed");

      const data: { path: string; url: string } = await response.json();
      setUploads((prev) =>
        prev.map((u) => (u.id === entry.id ? { ...u, status: "done", path: data.path, url: data.url } : u)),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setUploads((prev) => prev.map((u) => (u.id === entry.id ? { ...u, status: "error" } : u)));
    } finally {
      controllersRef.current.delete(entry.id);
    }
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const entries: UploadEntry[] = Array.from(files)
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          name: cleanName(file.name),
          status: "uploading" as const,
        }));

      setUploads((prev) => [...prev, ...entries]);
      entries.forEach(uploadOne);
    },
    [uploadOne],
  );

  const updateName = useCallback((id: string, name: string) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, name } : u)));
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => {
      const entry = prev.find((u) => u.id === id);
      if (!entry) return prev;

      controllersRef.current.get(id)?.abort();
      URL.revokeObjectURL(entry.previewUrl);

      if (entry.status === "done" && entry.path) {
        fetch(`/api/banners/upload?path=${encodeURIComponent(entry.path)}`, { method: "DELETE" }).catch(() => {});
      }

      return prev.filter((u) => u.id !== id);
    });
  }, []);

  const commit = useCallback(async (): Promise<BannerRow[]> => {
    const done = uploads.filter((u) => u.status === "done" && u.url);
    if (done.length === 0) return [];

    const response = await fetch("/api/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: done.map((u) => ({ url: u.url, name: u.name })) }),
    });
    if (!response.ok) throw new Error("commit failed");

    const data: { items: BannerRow[] } = await response.json();
    setUploads((prev) => prev.filter((u) => !done.some((d) => d.id === u.id)));
    return data.items;
  }, [uploads]);

  const doneCount = uploads.filter((u) => u.status === "done").length;

  return { uploads, addFiles, updateName, removeUpload, commit, doneCount };
}
