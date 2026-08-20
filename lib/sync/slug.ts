export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function resolveUniqueSlug(
  name: string,
  notionPageId: string,
  takenSlugs: Map<string, string>,
): string {
  const baseSlug = slugify(name) || "produto";
  const ownerOfBase = takenSlugs.get(baseSlug);

  if (!ownerOfBase || ownerOfBase === notionPageId) {
    takenSlugs.set(baseSlug, notionPageId);
    return baseSlug;
  }

  const disambiguatedSlug = `${baseSlug}-${notionPageId.replace(/-/g, "").slice(0, 6)}`;
  takenSlugs.set(disambiguatedSlug, notionPageId);
  return disambiguatedSlug;
}
