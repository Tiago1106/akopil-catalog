"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import ptBR from "@/locales/pt-BR.json";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/products/format-price";
import type { ProductRow } from "@/lib/supabase/types";
import { useCsvImport, type ExistingProduct } from "./use-csv-import";

function statusLabel(status: "ok" | "duplicate" | "invalid"): string {
  if (status === "duplicate") return ptBR.admin.products.import.statusDuplicate;
  if (status === "invalid") return ptBR.admin.products.import.statusInvalid;
  return ptBR.admin.products.import.statusOk;
}

export function ImportDialog({
  open,
  onOpenChange,
  existingProducts,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingProducts: ExistingProduct[];
  onImported: (created: ProductRow[]) => void;
}) {
  const { status, rows, acceptedCount, parseFile, reset, commit } = useCsvImport(existingProducts);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleConfirm() {
    try {
      const created = await commit();
      onImported(created);
      toast.success(ptBR.admin.products.import.summarySuccess.replace("{n}", String(created.length)));
      onOpenChange(false);
    } catch {
      toast.error(ptBR.admin.products.import.error);
    }
  }

  const confirmLabel =
    acceptedCount === 0
      ? ptBR.admin.products.import.confirmEmpty
      : (acceptedCount === 1
          ? ptBR.admin.products.import.confirmSingular
          : ptBR.admin.products.import.confirmPlural
        ).replace("{n}", String(acceptedCount));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{ptBR.admin.products.import.title}</DialogTitle>
          <DialogDescription>{ptBR.admin.products.import.description}</DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
          {status === "idle" || status === "error" ? (
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
                const file = event.dataTransfer.files[0];
                if (file) parseFile(file);
              }}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed px-5 py-7 text-center text-sm text-muted-foreground transition-colors ${
                isDragging ? "border-foreground bg-muted text-foreground" : "bg-muted"
              }`}
            >
              <Upload className="mb-1 size-5 text-gray-3" />
              <div>
                <strong className="font-bold text-foreground">
                  {ptBR.admin.products.import.dropzoneHint}
                </strong>
              </div>
              <div className="text-xs text-gray-3">{ptBR.admin.products.import.dropzoneFormats}</div>
              {status === "error" && (
                <div className="text-xs text-destructive">
                  {ptBR.admin.products.import.parseError}
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".zip"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) parseFile(file);
                  event.target.value = "";
                }}
              />
            </div>
          ) : status === "parsing" ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" />
              {ptBR.admin.products.import.parsing}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ptBR.admin.products.import.previewName}</TableHead>
                  <TableHead>{ptBR.admin.products.import.previewPrice}</TableHead>
                  <TableHead>{ptBR.admin.products.import.previewQuantity}</TableHead>
                  <TableHead>{ptBR.admin.products.import.previewImages}</TableHead>
                  <TableHead>{ptBR.admin.products.import.previewStatus}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.key} className={row.status === "ok" ? "" : "opacity-50"}>
                    <TableCell className="font-medium">{row.name || "—"}</TableCell>
                    <TableCell>{row.price !== null ? formatPrice(row.price) : "—"}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>
                      {row.foundImageCount}/{row.imageFilenames.length}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{statusLabel(row.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={acceptedCount === 0 || status === "importing"}
            onClick={handleConfirm}
          >
            {status === "importing" && <Loader2 className="animate-spin" />}
            {status === "importing" ? ptBR.admin.products.import.importing : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
