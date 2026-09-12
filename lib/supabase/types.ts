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

export type BannerRow = {
  id: string;
  image_url: string;
  desktop_image_url: string | null;
  link: string | null;
  name: string;
  active: boolean;
  position: number;
  created_at: string;
};

export type BannerInsert = Omit<BannerRow, "id" | "created_at" | "desktop_image_url"> & {
  id?: string;
  created_at?: string;
  desktop_image_url?: string | null;
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
      banners: {
        Row: BannerRow;
        Insert: BannerInsert;
        Update: Partial<BannerInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
