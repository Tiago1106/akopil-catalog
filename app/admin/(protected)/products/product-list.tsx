import ptBR from "@/locales/pt-BR.json";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProductRow } from "@/lib/supabase/types";
import { ProductRowItem } from "./product-row";

export function ProductList({
  products,
  onUpdate,
  onDelete,
}: {
  products: ProductRow[];
  onUpdate: (
    id: string,
    patch: Partial<Pick<ProductRow, "price" | "discount_price" | "quantity">>,
  ) => void;
  onDelete: (id: string) => void;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {ptBR.admin.products.listEmpty}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table className="table-fixed">
        <colgroup>
          <col />
          <col className="w-28" />
          <col className="w-28" />
          <col className="w-28" />
          <col className="w-24" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead>{ptBR.admin.products.columns.product}</TableHead>
            <TableHead>{ptBR.admin.products.columns.stock}</TableHead>
            <TableHead>{ptBR.admin.products.columns.price}</TableHead>
            <TableHead>{ptBR.admin.products.columns.discount}</TableHead>
            <TableHead className="text-right">{ptBR.admin.products.columns.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductRowItem key={product.id} product={product} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
