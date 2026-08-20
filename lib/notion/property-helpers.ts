import type { PageObjectResponse } from "@notionhq/client";

type Properties = PageObjectResponse["properties"];

function getProperty(properties: Properties, name: string) {
  return properties[name];
}

export function getTitleText(properties: Properties, name: string): string {
  const property = getProperty(properties, name);
  if (!property || property.type !== "title") return "";
  return property.title.map((item) => item.plain_text).join("");
}

export function getRichText(properties: Properties, name: string): string {
  const property = getProperty(properties, name);
  if (!property || property.type !== "rich_text") return "";
  return property.rich_text.map((item) => item.plain_text).join("");
}

export function getNumber(properties: Properties, name: string): number | null {
  const property = getProperty(properties, name);
  if (!property || property.type !== "number") return null;
  return property.number;
}

export function getSelectName(properties: Properties, name: string): string | null {
  const property = getProperty(properties, name);
  if (!property || property.type !== "select") return null;
  return property.select?.name ?? null;
}

export function getMultiSelectNames(properties: Properties, name: string): string[] {
  const property = getProperty(properties, name);
  if (!property || property.type !== "multi_select") return [];
  return property.multi_select.map((option) => option.name);
}

export function getCheckbox(properties: Properties, name: string): boolean {
  const property = getProperty(properties, name);
  if (!property || property.type !== "checkbox") return false;
  return property.checkbox;
}

export function getFileUrls(properties: Properties, name: string): string[] {
  const property = getProperty(properties, name);
  if (!property || property.type !== "files") return [];
  return property.files
    .map((file) => (file.type === "file" ? file.file.url : file.external.url))
    .filter((url): url is string => Boolean(url));
}
