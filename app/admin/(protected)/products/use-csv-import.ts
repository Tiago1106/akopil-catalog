"use client";

import { useState } from "react";
import JSZip from "jszip";
import Papa from "papaparse";
import { resolveUniqueSlug } from "@/lib/products/slug";
import type { ProductRow } from "@/lib/supabase/types";

const UPLOAD_CONCURRENCY = 5;

export type ExistingProduct = Pick<ProductRow, "id" | "name" | "slug">;

export type ParsedRow = {
  key: string;
  name: string;
  price: number | null;
  discountPrice: number | null;
  material: string[];
  description: string;
  tags: string[];
  active: boolean;
  bestSeller: boolean;
  quantity: number;
  imageFilenames: string[];
  foundImageCount: number;
  status: "ok" | "duplicate" | "invalid";
};

type NotionCsvRow = {
  Name?: string;
  Ativo?: string;
  "Best Seller"?: string;
  Description?: string;
  Images?: string;
  Material?: string;
  "Original Price"?: number | string;
  Price?: number | string;
  Quantidade?: number | string;
  Tags?: string;
};

function toNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function useCsvImport(existingProducts: ExistingProduct[]) {
  const [zip, setZip] = useState<JSZip | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [status, setStatus] = useState<"idle" | "parsing" | "ready" | "importing" | "error">("idle");

  async function parseFile(file: File) {
    setStatus("parsing");
    try {
      const loaded = await JSZip.loadAsync(file);
      const csvEntryName = Object.keys(loaded.files).find(
        (name) => name.toLowerCase().endsWith(".csv") && !loaded.files[name].dir,
      );
      if (!csvEntryName) throw new Error("no csv entry found in zip");

      const csvText = await loaded.files[csvEntryName].async("string");
      const parsed = Papa.parse<NotionCsvRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      const existingNames = new Set(
        existingProducts.map((product) => product.name.trim().toLowerCase()),
      );
      const seenNames = new Set<string>();

      const parsedRows: ParsedRow[] = parsed.data.map((raw, index) => {
        const name = (raw.Name ?? "").trim();
        // Notion exportava "Price" como o valor cobrado e "Original Price" como o valor
        // cheio de referência (semântica antiga) — invertido aqui pro schema atual, onde
        // `price` é sempre o valor real e `discount_price` é o valor com desconto.
        const legacyChargedPrice = toNumberOrNull(raw.Price);
        const legacyFullPrice = toNumberOrNull(raw["Original Price"]);
        const price = legacyFullPrice ?? legacyChargedPrice;
        const discountPrice = legacyFullPrice !== null ? legacyChargedPrice : null;
        const imageFilenames = splitList(raw.Images);
        const normalizedName = name.toLowerCase();

        const foundImageCount = imageFilenames.filter((filename) => {
          const entry = loaded.files[filename];
          return entry && !entry.dir;
        }).length;

        let rowStatus: ParsedRow["status"] = "ok";
        if (!name || legacyChargedPrice === null) {
          rowStatus = "invalid";
        } else if (existingNames.has(normalizedName) || seenNames.has(normalizedName)) {
          rowStatus = "duplicate";
        }
        seenNames.add(normalizedName);

        return {
          key: `${index}-${name}`,
          name,
          price,
          discountPrice,
          material: splitList(raw.Material),
          description: raw.Description?.trim() ?? "",
          tags: splitList(raw.Tags),
          active: raw.Ativo === "Yes",
          bestSeller: raw["Best Seller"] === "Yes",
          quantity: toNumberOrNull(raw.Quantidade) ?? 0,
          imageFilenames,
          foundImageCount,
          status: rowStatus,
        };
      });

      setZip(loaded);
      setRows(parsedRows);
      setStatus("ready");
    } catch (error) {
      console.error("[products] csv import parse failed:", error);
      setStatus("error");
    }
  }

  function reset() {
    setZip(null);
    setRows([]);
    setStatus("idle");
  }

  async function commit(): Promise<ProductRow[]> {
    if (!zip) return [];
    const acceptedRows = rows.filter((row) => row.status === "ok");
    if (acceptedRows.length === 0) return [];

    setStatus("importing");

    const takenSlugs = new Map(existingProducts.map((product) => [product.slug, product.id]));

    const assembled = await Promise.all(
      acceptedRows.map(async (row) => {
        const id = crypto.randomUUID();
        const slug = resolveUniqueSlug(row.name, id, takenSlugs);

        const imageUrls: string[] = [];
        for (let i = 0; i < row.imageFilenames.length; i += UPLOAD_CONCURRENCY) {
          const batch = row.imageFilenames.slice(i, i + UPLOAD_CONCURRENCY);
          const uploaded = await Promise.all(
            batch.map(async (filename) => {
              const entry = zip.files[filename];
              if (!entry || entry.dir) return null;
              const blob = await entry.async("blob");
              const file = new File([blob], filename, { type: blob.type || "image/jpeg" });

              const formData = new FormData();
              formData.append("file", file);
              formData.append("productId", id);
              const response = await fetch("/api/products/upload", { method: "POST", body: formData });
              if (!response.ok) return null;
              const data: { url: string } = await response.json();
              return data.url;
            }),
          );
          imageUrls.push(...uploaded.filter((url): url is string => url !== null));
        }

        return {
          id,
          slug,
          name: row.name,
          price: row.price ?? 0,
          discount_price: row.discountPrice,
          material: row.material,
          description: row.description || null,
          tags: row.tags,
          images: imageUrls,
          active: row.active,
          best_seller: row.bestSeller,
          quantity: row.quantity,
        };
      }),
    );

    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: assembled }),
    });

    if (!response.ok) {
      setStatus("ready");
      throw new Error("import commit failed");
    }

    const data: { items: ProductRow[] } = await response.json();
    reset();
    return data.items;
  }

  const acceptedCount = rows.filter((row) => row.status === "ok").length;

  return { status, rows, acceptedCount, parseFile, reset, commit };
}
