"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2, Trash2 } from "lucide-react";
import ptBR from "@/locales/pt-BR.json";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import type { ProductRow } from "@/lib/supabase/types";

const DEBOUNCE_MS = 450;

function useDebouncedField<T>(value: T, onCommit: (value: T) => void) {
  const [prevValue, setPrevValue] = useState(value);
  const [local, setLocal] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (value !== prevValue) {
    setPrevValue(value);
    setLocal(value);
  }

  function set(next: T) {
    setLocal(next);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onCommit(next), DEBOUNCE_MS);
  }

  return [local, set] as const;
}

export function ProductRowItem({
  product,
  onUpdate,
  onDelete,
}: {
  product: ProductRow;
  onUpdate: (
    id: string,
    patch: Partial<Pick<ProductRow, "price" | "discount_price" | "quantity">>,
  ) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);

  const [quantity, setQuantity] = useDebouncedField(product.quantity, (value) =>
    onUpdate(product.id, { quantity: value }),
  );
  const [price, setPrice] = useDebouncedField(product.price, (value) =>
    onUpdate(product.id, { price: value }),
  );
  const [discountPrice, setDiscountPrice] = useDebouncedField(product.discount_price, (value) =>
    onUpdate(product.id, { discount_price: value }),
  );

  async function handleDuplicate() {
    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/products/${product.id}/duplicate`, { method: "POST" });
      if (!response.ok) throw new Error("duplicate failed");
      const data: { product: ProductRow } = await response.json();
      router.push(`/admin/products/${data.product.id}`);
    } catch {
      toast.error(ptBR.admin.products.duplicateError);
      setIsDuplicating(false);
    }
  }

  return (
    <TableRow className={product.active ? "" : "opacity-60"}>
      <TableCell>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsImageOpen(true)}
            aria-label={ptBR.admin.products.expandImage}
            className="size-16 shrink-0 overflow-hidden rounded-lg border bg-muted"
          >
            {product.images[0] && (
              <Image
                src={product.images[0]}
                alt={product.name}
                width={64}
                height={64}
                className="size-full object-cover"
              />
            )}
          </button>
          <Link
            href={`/admin/products/${product.id}`}
            className="min-w-0 truncate text-sm font-medium hover:underline"
          >
            {product.name}
          </Link>
        </div>

        {product.images[0] && (
          <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogTitle className="sr-only">{product.name}</DialogTitle>
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="512px"
                  className="object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </TableCell>

      <TableCell>
        <input
          type="number"
          min="0"
          step="1"
          value={quantity}
          onChange={(event) => setQuantity(Math.max(0, Math.round(Number(event.target.value)) || 0))}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm focus-visible:border-ring focus-visible:outline-none"
        />
      </TableCell>

      <TableCell>
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(Math.max(0, Number(event.target.value)) || 0)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm focus-visible:border-ring focus-visible:outline-none"
        />
      </TableCell>

      <TableCell>
        <input
          type="number"
          min="0"
          step="0.01"
          value={discountPrice ?? ""}
          placeholder="R$"
          onChange={(event) =>
            setDiscountPrice(event.target.value === "" ? null : Math.max(0, Number(event.target.value)))
          }
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none"
        />
      </TableCell>

      <TableCell>
        <div className="flex justify-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={ptBR.admin.products.duplicate}
            disabled={isDuplicating}
            onClick={handleDuplicate}
          >
            {isDuplicating ? <Loader2 className="animate-spin" /> : <Copy />}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label={ptBR.admin.products.delete}>
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{ptBR.admin.products.deleteConfirm.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {ptBR.admin.products.deleteConfirm.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{ptBR.admin.products.deleteConfirm.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(product.id)}>
                  {ptBR.admin.products.deleteConfirm.confirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
