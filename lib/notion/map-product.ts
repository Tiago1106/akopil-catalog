import type { PageObjectResponse } from "@notionhq/client";
import {
  getCheckbox,
  getFileUrls,
  getMultiSelectNames,
  getNumber,
  getRichText,
  getSelectName,
  getTitleText,
} from "./property-helpers";

export type MappedNotionProduct = {
  notionPageId: string;
  name: string;
  description: string;
  price: number | null;
  originalPrice: number | null;
  material: string | null;
  tags: string[];
  imageUrls: string[];
  bestSeller: boolean;
  active: boolean;
};

export function mapNotionPageToProduct(page: PageObjectResponse): MappedNotionProduct {
  const { properties } = page;

  return {
    notionPageId: page.id,
    name: getTitleText(properties, "Name"),
    description: getRichText(properties, "Description"),
    price: getNumber(properties, "Price"),
    originalPrice: getNumber(properties, "Original Price"),
    material: getSelectName(properties, "Material"),
    tags: getMultiSelectNames(properties, "Tags"),
    imageUrls: getFileUrls(properties, "Images"),
    bestSeller: getCheckbox(properties, "Best Seller"),
    active: getCheckbox(properties, "Ativo"),
  };
}

export function isValidProduct(
  product: MappedNotionProduct,
): product is MappedNotionProduct & { price: number } {
  return product.name.trim().length > 0 && product.price !== null;
}
