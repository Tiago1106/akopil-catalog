"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Upload } from "lucide-react";
import ptBR from "@/locales/pt-BR.json";
import { Button } from "@/components/ui/button";
import type { ProductRow } from "@/lib/supabase/types";
import { ProductList } from "./product-list";
import { ImportDialog } from "./import-dialog";
import { PaginationControls } from "./pagination-controls";

export function ProductsManager({
  initialProducts,
  allProducts,
  page,
  pageSize,
  totalCount,
}: {
  initialProducts: ProductRow[];
  allProducts: Pick<ProductRow, "id" | "name" | "slug">[];
  page: number;
  pageSize: number;
  totalCount: number;
}) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [importOpen, setImportOpen] = useState(false);

  async function handleUpdate(
    id: string,
    patch: Partial<Pick<ProductRow, "price" | "discount_price" | "quantity">>,
  ) {
    const previous = products;
    setProducts((prev) => prev.map((product) => (product.id === id ? { ...product, ...patch } : product)));

    const response = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setProducts(previous);
      toast.error(ptBR.admin.products.updateError);
    }
  }

  async function handleDelete(id: string) {
    const previous = products;
    setProducts((prev) => prev.filter((product) => product.id !== id));

    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setProducts(previous);
      toast.error(ptBR.admin.products.deleteError);
    }
  }

  function handleImported(created: ProductRow[]) {
    if (created.length > 0) {
      router.push(`/admin/products?page=1&pageSize=${pageSize}`);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">{ptBR.admin.products.title}</h1>
          <p className="text-sm text-muted-foreground">{ptBR.admin.products.description}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload />
            {ptBR.admin.products.importButton}
          </Button>
          <Button type="button" asChild>
            <Link href="/admin/products/new">
              <Plus />
              {ptBR.admin.products.addButton}
            </Link>
          </Button>
        </div>
      </div>

      <ProductList products={products} onUpdate={handleUpdate} onDelete={handleDelete} />

      <PaginationControls page={page} pageSize={pageSize} totalCount={totalCount} />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        existingProducts={allProducts}
        onImported={handleImported}
      />
    </div>
  );
}
