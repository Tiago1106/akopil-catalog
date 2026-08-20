export type ProductRow = {
  id: string;
  notion_page_id: string;
  slug: string;
  name: string;
  price: number;
  original_price: number | null;
  material: string | null;
  description: string | null;
  tags: string[];
  images: string[];
  active: boolean;
  best_seller: boolean;
  synced_at: string;
  created_at: string;
};

export type ProductInsert = Omit<
  ProductRow,
  "id" | "created_at" | "synced_at"
> & {
  id?: string;
  created_at?: string;
  synced_at?: string;
};

export type Database = {
  public: {
    Tables: {
      products: {
        Row: ProductRow;
        Insert: ProductInsert;
        Update: Partial<ProductInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
