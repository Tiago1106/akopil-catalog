import { getProductOptions } from "@/lib/product-options/queries";
import { ProductOptionsManager } from "./product-options-manager";

export default async function AdminTagsPage() {
  const options = await getProductOptions();

  return <ProductOptionsManager initialOptions={options} />;
}
