"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ptBR from "@/locales/pt-BR.json";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZES = [30, 50, 100];

export function PaginationControls({
  page,
  pageSize,
  totalCount,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
}) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function goTo(nextPage: number, nextPageSize: number) {
    router.push(`/admin/products?page=${nextPage}&pageSize=${nextPageSize}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>{ptBR.admin.products.pagination.pageSizeLabel}</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => goTo(1, Number(value))}
        >
          <SelectTrigger size="sm" className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">
          {ptBR.admin.products.pagination.pageLabel
            .replace("{page}", String(page))
            .replace("{totalPages}", String(totalPages))}
        </span>
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => goTo(page - 1, pageSize)}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages}
            onClick={() => goTo(page + 1, pageSize)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
