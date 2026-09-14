"use client";

import { useState } from "react";
import { toast } from "sonner";
import ptBR from "@/locales/pt-BR.json";
import type { ProductOptionRow } from "@/lib/supabase/types";
import { OptionSection } from "./option-section";

export function ProductOptionsManager({
  initialOptions,
}: {
  initialOptions: ProductOptionRow[];
}) {
  const [options, setOptions] = useState<ProductOptionRow[]>(initialOptions);

  async function handleCreate(type: "material" | "tag", name: string) {
    const response = await fetch("/api/product-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, name }),
    });

    if (!response.ok) {
      if (response.status === 409) {
        toast.error(ptBR.admin.tags.duplicateError);
      } else {
        toast.error(ptBR.admin.tags.createError);
      }
      return;
    }

    const data: { item: ProductOptionRow } = await response.json();
    setOptions((prev) => [...prev, data.item]);
  }

  async function handleDelete(id: string) {
    const previous = options;
    setOptions((prev) => prev.filter((option) => option.id !== id));

    const response = await fetch(`/api/product-options/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setOptions(previous);
      toast.error(ptBR.admin.tags.deleteError);
    }
  }

  const materials = options.filter((option) => option.type === "material");
  const tags = options.filter((option) => option.type === "tag");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold">{ptBR.admin.tags.title}</h1>
        <p className="text-sm text-muted-foreground">{ptBR.admin.tags.description}</p>
      </div>

      <div className="grid gap-6 catalog:grid-cols-2">
        <OptionSection
          title={ptBR.admin.tags.materialSection}
          options={materials}
          onCreate={(name) => handleCreate("material", name)}
          onDelete={handleDelete}
        />
        <OptionSection
          title={ptBR.admin.tags.tagSection}
          options={tags}
          onCreate={(name) => handleCreate("tag", name)}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
