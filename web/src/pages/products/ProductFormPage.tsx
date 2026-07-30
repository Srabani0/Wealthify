import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, type Control } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  createProductSchema,
  updateProductSchema,
  DEFAULT_UNITS,
  DEFAULT_UNIT,
  type CreateProductInput,
  type ProductVariantSummary,
  type UpdateProductInput,
} from "@wealthify/shared";
import { useCategories } from "@/features/categories/hooks";
import { useBrands } from "@/features/brands/hooks";
import {
  useAddProductImage,
  useAddProductVariant,
  useCreateProduct,
  useDeleteProductImage,
  useDeleteProductVariant,
  useProduct,
  useUpdateProduct,
  useUpdateProductVariant,
} from "@/features/products/hooks";
import { useVariantCodeImage } from "@/features/products/useVariantCodeImage";
import { uploadFile } from "@/features/uploads/api";
import { getErrorMessage } from "@/lib/errors";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DropzoneUpload } from "@/components/common/DropzoneUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const NONE_VALUE = "__none__";

function ProductBasicFields({
  control,
  categories,
  brands,
}: {
  control: Control<CreateProductInput> | Control<UpdateProductInput>;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        // @ts-expect-error -- shared across create/update forms with slightly different field types
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Product name</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        // @ts-expect-error -- shared across create/update forms with slightly different field types
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value ?? ""} rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        // @ts-expect-error -- shared across create/update forms with slightly different field types
        control={control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select
              value={field.value || NONE_VALUE}
              onValueChange={(value) => field.onChange(value === NONE_VALUE ? "" : value)}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        // @ts-expect-error -- shared across create/update forms with slightly different field types
        control={control}
        name="brandId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand</FormLabel>
            <Select
              value={field.value || NONE_VALUE}
              onValueChange={(value) => field.onChange(value === NONE_VALUE ? "" : value)}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        // @ts-expect-error -- shared across create/update forms with slightly different field types
        control={control}
        name="hsnCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>HSN code</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        // @ts-expect-error -- shared across create/update forms with slightly different field types
        control={control}
        name="gstRate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>GST rate (%)</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        // @ts-expect-error -- shared across create/update forms with slightly different field types
        control={control}
        name="unit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Unit</FormLabel>
            <Select value={field.value ?? DEFAULT_UNIT} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {DEFAULT_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        // @ts-expect-error -- shared across create/update forms with slightly different field types
        control={control}
        name="hasVariants"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-6">
            <FormControl>
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            </FormControl>
            <FormLabel className="mt-0!">This product has variants (size, color, etc.)</FormLabel>
          </FormItem>
        )}
      />
    </div>
  );
}

function marginPreview(cost: string, selling: string): string {
  const c = Number(cost);
  const s = Number(selling);
  if (!s || Number.isNaN(c) || Number.isNaN(s)) return "—";
  return `${(((s - c) / s) * 100).toFixed(1)}%`;
}

function ProductCreateForm() {
  const navigate = useNavigate();
  const categories = useCategories();
  const brands = useBrands();
  const createProduct = useCreateProduct();

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      unit: DEFAULT_UNIT,
      hasVariants: false,
      variants: [{ variantName: "Default", costPrice: 0, sellingPrice: 0, lowStockThreshold: 5 }],
    },
  });

  const variantsArray = useFieldArray({ control: form.control, name: "variants" });
  const hasVariants = form.watch("hasVariants");

  function onHasVariantsChange(checked: boolean) {
    form.setValue("hasVariants", checked);
    if (!checked) {
      const first = form.getValues("variants")[0] ?? {
        variantName: "Default",
        costPrice: 0,
        sellingPrice: 0,
        lowStockThreshold: 5,
      };
      form.setValue("variants", [{ ...first, variantName: "Default" }]);
    }
  }

  function onSubmit(values: CreateProductInput) {
    createProduct.mutate(values, {
      onSuccess: (product) => {
        toast.success("Product created");
        navigate(`/products/${product?.id}/edit`);
      },
      onError: (error) => toast.error(getErrorMessage(error, "Failed to create product")),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product details</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductBasicFields
              control={form.control}
              categories={categories.data ?? []}
              brands={brands.data ?? []}
            />
            <input
              type="checkbox"
              className="hidden"
              checked={hasVariants}
              onChange={(e) => onHasVariantsChange(e.target.checked)}
              readOnly
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{hasVariants ? "Variants" : "Pricing & stock"}</CardTitle>
            {hasVariants && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  variantsArray.append({
                    variantName: "",
                    costPrice: 0,
                    sellingPrice: 0,
                    lowStockThreshold: 5,
                  })
                }
              >
                <Plus className="mr-2 size-4" />
                Add variant
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {variantsArray.fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border p-4">
                <div className="grid gap-3 sm:grid-cols-6">
                  {hasVariants && (
                    <FormField
                      control={form.control}
                      name={`variants.${index}.variantName`}
                      render={({ field: f }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Variant name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Small, Black" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name={`variants.${index}.sku`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Auto-generated" {...f} value={f.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`variants.${index}.costPrice`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Cost price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`variants.${index}.sellingPrice`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Selling price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`variants.${index}.lowStockThreshold`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Low stock at</FormLabel>
                        <FormControl>
                          <Input type="number" {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Margin:{" "}
                    {marginPreview(
                      String(form.watch(`variants.${index}.costPrice`) ?? 0),
                      String(form.watch(`variants.${index}.sellingPrice`) ?? 0),
                    )}
                  </span>
                  {hasVariants && variantsArray.fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => variantsArray.remove(index)}
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" disabled={createProduct.isPending}>
          {createProduct.isPending ? "Creating…" : "Create product"}
        </Button>
      </form>
    </Form>
  );
}

interface VariantDraft {
  key: string;
  id?: string;
  variantName: string;
  sku: string;
  barcode: string;
  costPrice: string;
  sellingPrice: string;
  mrp: string;
  lowStockThreshold: string;
}

function draftFromVariant(v: ProductVariantSummary): VariantDraft {
  return {
    key: v.id,
    id: v.id,
    variantName: v.variantName,
    sku: v.sku,
    barcode: v.barcode ?? "",
    costPrice: v.costPrice,
    sellingPrice: v.sellingPrice,
    mrp: v.mrp ?? "",
    lowStockThreshold: String(v.lowStockThreshold),
  };
}

let tempKeyCounter = 0;
function blankDraft(): VariantDraft {
  return {
    key: `temp-${++tempKeyCounter}`,
    variantName: "",
    sku: "",
    barcode: "",
    costPrice: "0",
    sellingPrice: "0",
    mrp: "",
    lowStockThreshold: "5",
  };
}

function VariantCodePreview({ variantId, sku }: { variantId: string; sku: string }) {
  const barcode = useVariantCodeImage(variantId, "barcode");
  const qrcode = useVariantCodeImage(variantId, "qrcode");

  if (!barcode.url && !qrcode.url) return null;

  return (
    <div className="flex items-center gap-3">
      {barcode.url && (
        <a href={barcode.url} download={`${sku}-barcode.png`} title="Download barcode">
          <img src={barcode.url} alt="Barcode" className="h-9 rounded border bg-white p-1" />
        </a>
      )}
      {qrcode.url && (
        <a href={qrcode.url} download={`${sku}-qrcode.png`} title="Download QR code">
          <img src={qrcode.url} alt="QR code" className="size-9 rounded border bg-white p-1" />
        </a>
      )}
    </div>
  );
}

function ProductEditView({ productId }: { productId: string }) {
  const categories = useCategories();
  const brands = useBrands();
  const product = useProduct(productId);
  const updateProduct = useUpdateProduct();
  const addProductVariant = useAddProductVariant();
  const updateProductVariant = useUpdateProductVariant();
  const deleteProductVariant = useDeleteProductVariant();
  const addProductImage = useAddProductImage();
  const deleteProductImage = useDeleteProductImage();

  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([]);
  const [draftsInitialized, setDraftsInitialized] = useState(false);
  const [savingVariants, setSavingVariants] = useState(false);
  const [pendingDeleteVariant, setPendingDeleteVariant] = useState<{ id: string; name: string } | null>(null);
  const [pendingDeleteImage, setPendingDeleteImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<UpdateProductInput>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (!product.data) return;
    form.reset({
      name: product.data.name,
      description: product.data.description ?? "",
      categoryId: product.data.categoryId ?? "",
      brandId: product.data.brandId ?? "",
      hsnCode: product.data.hsnCode ?? "",
      gstRate: Number(product.data.gstRate),
      unit: product.data.unit,
      hasVariants: product.data.hasVariants,
    });
  }, [product.data, form]);

  useEffect(() => {
    if (product.data && !draftsInitialized) {
      setVariantDrafts(product.data.variants.map(draftFromVariant));
      setDraftsInitialized(true);
    }
  }, [product.data, draftsInitialized]);

  const hasVariants = form.watch("hasVariants");

  function onSubmit(values: UpdateProductInput) {
    updateProduct.mutate(
      { id: productId, input: values },
      {
        onSuccess: () => toast.success("Product updated"),
        onError: (error) => toast.error(getErrorMessage(error, "Failed to update product")),
      },
    );
  }

  function updateDraft(key: string, patch: Partial<VariantDraft>) {
    setVariantDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function removeDraftRow(draft: VariantDraft) {
    if (draft.id) {
      setPendingDeleteVariant({ id: draft.id, name: draft.variantName || draft.sku });
    } else {
      setVariantDrafts((prev) => prev.filter((d) => d.key !== draft.key));
    }
  }

  function confirmDeleteVariant() {
    if (!pendingDeleteVariant) return;
    deleteProductVariant.mutate(
      { variantId: pendingDeleteVariant.id, productId },
      {
        onSuccess: () => {
          toast.success("Variant removed");
          setVariantDrafts((prev) => prev.filter((d) => d.id !== pendingDeleteVariant.id));
          setPendingDeleteVariant(null);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Failed to remove variant")),
      },
    );
  }

  async function handleSaveVariants() {
    setSavingVariants(true);
    try {
      for (const draft of variantDrafts) {
        const payload = {
          variantName: draft.variantName.trim() || "Default",
          sku: draft.sku.trim() || undefined,
          barcode: draft.barcode.trim() || null,
          costPrice: Number(draft.costPrice) || 0,
          sellingPrice: Number(draft.sellingPrice) || 0,
          mrp: draft.mrp.trim() ? Number(draft.mrp) : null,
          lowStockThreshold: Number(draft.lowStockThreshold) || 0,
        };

        if (draft.id) {
          await updateProductVariant.mutateAsync({ variantId: draft.id, productId, input: payload });
        } else {
          await addProductVariant.mutateAsync({ productId, input: payload });
        }
      }
      toast.success("Variants saved");
      const fresh = await product.refetch();
      if (fresh.data) {
        setVariantDrafts(fresh.data.variants.map(draftFromVariant));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save variants"));
    } finally {
      setSavingVariants(false);
    }
  }

  async function handleImageFile(file: File) {
    setIsUploadingImage(true);
    try {
      const uploaded = await uploadFile("products", file);
      await addProductImage.mutateAsync({
        productId,
        input: { url: uploaded.url, publicId: uploaded.publicId },
      });
      toast.success("Image added");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload image"));
    } finally {
      setIsUploadingImage(false);
    }
  }

  function confirmDeleteImage() {
    if (!pendingDeleteImage) return;
    deleteProductImage.mutate(
      { imageId: pendingDeleteImage, productId },
      {
        onSuccess: () => {
          toast.success("Image removed");
          setPendingDeleteImage(null);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Failed to remove image")),
      },
    );
  }

  if (product.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!product.data) {
    return <p className="text-sm text-muted-foreground">Product not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProductBasicFields
                control={form.control}
                categories={categories.data ?? []}
                brands={brands.data ?? []}
              />
              <Button type="submit" disabled={updateProduct.isPending}>
                {updateProduct.isPending ? "Saving…" : "Save changes"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </Form>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{hasVariants ? "Variants" : "Pricing & stock"}</CardTitle>
          <div className="flex items-center gap-2">
            {hasVariants && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVariantDrafts((prev) => [...prev, blankDraft()])}
              >
                <Plus className="mr-2 size-4" />
                Add variant
              </Button>
            )}
            <Button type="button" size="sm" disabled={savingVariants} onClick={handleSaveVariants}>
              {savingVariants ? "Saving…" : "Save variants"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {variantDrafts.map((draft) => (
            <div key={draft.key} className="rounded-lg border p-4">
              <div className="grid gap-3 sm:grid-cols-6">
                {hasVariants && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium">Variant name</label>
                    <Input
                      className="mt-1.5"
                      placeholder="e.g. Small, Black"
                      value={draft.variantName}
                      onChange={(e) => updateDraft(draft.key, { variantName: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">SKU</label>
                  <Input
                    className="mt-1.5"
                    placeholder="Auto-generated"
                    value={draft.sku}
                    onChange={(e) => updateDraft(draft.key, { sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cost price</label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    step="0.01"
                    value={draft.costPrice}
                    onChange={(e) => updateDraft(draft.key, { costPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Selling price</label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    step="0.01"
                    value={draft.sellingPrice}
                    onChange={(e) => updateDraft(draft.key, { sellingPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Low stock at</label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    value={draft.lowStockThreshold}
                    onChange={(e) => updateDraft(draft.key, { lowStockThreshold: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Margin: {marginPreview(draft.costPrice, draft.sellingPrice)}</span>
                  {draft.id && <VariantCodePreview variantId={draft.id} sku={draft.sku} />}
                </div>
                {(hasVariants || variantDrafts.length > 1) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={variantDrafts.length <= 1}
                    onClick={() => removeDraftRow(draft)}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {product.data.images.map((image) => (
              <div key={image.id} className="group relative size-24 overflow-hidden rounded-lg border">
                <img src={image.url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  className="absolute right-1 top-1 hidden rounded-full bg-background/90 p-1 text-xs group-hover:block"
                  onClick={() => setPendingDeleteImage(image.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            <DropzoneUpload
              className="size-24 min-h-0 p-2"
              isUploading={isUploadingImage}
              onFileSelected={handleImageFile}
              label="Add image"
            />
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingDeleteVariant}
        onOpenChange={(open) => !open && setPendingDeleteVariant(null)}
        title={`Remove variant "${pendingDeleteVariant?.name}"?`}
        description="This can't be undone."
        confirmLabel="Remove"
        destructive
        isLoading={deleteProductVariant.isPending}
        onConfirm={confirmDeleteVariant}
      />
      <ConfirmDialog
        open={!!pendingDeleteImage}
        onOpenChange={(open) => !open && setPendingDeleteImage(null)}
        title="Remove this image?"
        confirmLabel="Remove"
        destructive
        isLoading={deleteProductImage.isPending}
        onConfirm={confirmDeleteImage}
      />
    </div>
  );
}

export function ProductFormPage() {
  const { id } = useParams();

  return (
    <div>
      <PageHeader
        title={id ? "Edit product" : "Add product"}
        description={
          id ? "Update product details, variants, and images." : "Create a new product in your catalog."
        }
      />
      {id ? <ProductEditView productId={id} /> : <ProductCreateForm />}
    </div>
  );
}
