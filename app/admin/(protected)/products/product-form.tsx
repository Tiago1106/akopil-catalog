"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import ptBR from "@/locales/pt-BR.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { resolveUniqueSlug } from "@/lib/products/slug";
import type { ProductOptionRow, ProductRow } from "@/lib/supabase/types";
import { ImageManager } from "./image-manager";
import { OptionMultiselect } from "./option-multiselect";

export function ProductForm({
  mode,
  product,
  existingSlugs,
  options,
}: {
  mode: "create" | "edit";
  product?: ProductRow;
  existingSlugs: { id: string; slug: string }[];
  options: ProductOptionRow[];
}) {
  const materialOptions = options.filter((o) => o.type === "material").map((o) => o.name);
  const tagOptions = options.filter((o) => o.type === "tag").map((o) => o.name);

  const router = useRouter();
  const [productId] = useState(() => product?.id ?? crypto.randomUUID());

  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [discountPrice, setDiscountPrice] = useState(
    product?.discount_price != null ? String(product.discount_price) : "",
  );
  const [material, setMaterial] = useState<string[]>(product?.material ?? []);
  const [description, setDescription] = useState(product?.description ?? "");
  const [tags, setTags] = useState<string[]>(product?.tags ?? []);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [active, setActive] = useState(product?.active ?? true);
  const [bestSeller, setBestSeller] = useState(product?.best_seller ?? false);
  const [quantity, setQuantity] = useState(product ? String(product.quantity) : "0");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const parsedPrice = Number(price);

    if (!trimmedName) {
      setError(ptBR.admin.products.form.nameRequired);
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError(ptBR.admin.products.form.priceRequired);
      return;
    }

    const payload = {
      name: trimmedName,
      price: parsedPrice,
      discount_price: discountPrice.trim() ? Number(discountPrice) : null,
      material,
      description: description.trim() || null,
      tags,
      images,
      active,
      best_seller: bestSeller,
      quantity: Math.max(0, Math.round(Number(quantity)) || 0),
    };

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        const takenSlugs = new Map(existingSlugs.map((p) => [p.slug, p.id]));
        const slug = resolveUniqueSlug(trimmedName, productId, takenSlugs);

        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [{ id: productId, slug, ...payload }] }),
        });
        if (!response.ok) throw new Error("create failed");
      } else {
        const response = await fetch(`/api/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("update failed");
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error(
        mode === "create" ? ptBR.admin.products.createError : ptBR.admin.products.updateError,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <Link
          href="/admin/products"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {ptBR.admin.products.form.back}
        </Link>
        <h1 className="text-lg font-bold">
          {mode === "create" ? ptBR.admin.products.form.createTitle : ptBR.admin.products.form.editTitle}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{ptBR.admin.products.form.sections.nameDescription}</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">{ptBR.admin.products.form.nameLabel}</FieldLabel>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>

              <Field>
                <FieldLabel htmlFor="description">
                  {ptBR.admin.products.form.descriptionLabel}
                </FieldLabel>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{ptBR.admin.products.form.sections.photos}</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageManager productId={productId} images={images} onChange={setImages} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{ptBR.admin.products.form.sections.pricing}</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="price">{ptBR.admin.products.form.priceLabel}</FieldLabel>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="discount_price">
                    {ptBR.admin.products.form.discountPriceLabel}
                  </FieldLabel>
                  <Input
                    id="discount_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="quantity">{ptBR.admin.products.form.quantityLabel}</FieldLabel>
                  <Input
                    id="quantity"
                    type="number"
                    step="1"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </Field>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{ptBR.admin.products.form.sections.materialTags}</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="material">{ptBR.admin.products.form.materialLabel}</FieldLabel>
                  <OptionMultiselect
                    id="material"
                    value={material}
                    onChange={setMaterial}
                    items={materialOptions}
                    placeholder={ptBR.admin.products.form.materialPlaceholder}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="tags">{ptBR.admin.products.form.tagsLabel}</FieldLabel>
                  <OptionMultiselect
                    id="tags"
                    value={tags}
                    onChange={setTags}
                    items={tagOptions}
                    placeholder={ptBR.admin.products.form.tagsPlaceholder}
                  />
                </Field>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{ptBR.admin.products.form.sections.visibility}</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="active">{ptBR.admin.products.form.activeLabel}</FieldLabel>
                <Switch id="active" checked={active} onCheckedChange={setActive} />
              </Field>

              <Field orientation="horizontal">
                <FieldLabel htmlFor="best_seller">
                  {ptBR.admin.products.form.bestSellerLabel}
                </FieldLabel>
                <Switch id="best_seller" checked={bestSeller} onCheckedChange={setBestSeller} />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {error && <FieldError>{error}</FieldError>}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {mode === "create"
              ? ptBR.admin.products.form.submitCreate
              : ptBR.admin.products.form.submitEdit}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
            {ptBR.admin.products.form.cancel}
          </Button>
        </div>
      </form>
    </div>
  );
}
