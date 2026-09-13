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
  ownerId: string,
  takenSlugs: Map<string, string>,
): string {
  const baseSlug = slugify(name) || "produto";
  const ownerOfBase = takenSlugs.get(baseSlug);

  if (!ownerOfBase || ownerOfBase === ownerId) {
    takenSlugs.set(baseSlug, ownerId);
    return baseSlug;
  }

  const disambiguatedSlug = `${baseSlug}-${ownerId.replace(/-/g, "").slice(0, 6)}`;
  takenSlugs.set(disambiguatedSlug, ownerId);
  return disambiguatedSlug;
}
