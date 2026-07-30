import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Plus, Tag, Tags } from "lucide-react";
import {
  createBrandSchema,
  createCategorySchema,
  type BrandSummary,
  type CategorySummary,
  type CreateBrandInput,
  type CreateCategoryInput,
} from "@wealthify/shared";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/features/categories/hooks";
import { useBrands, useCreateBrand, useDeleteBrand, useUpdateBrand } from "@/features/brands/hooks";
import { getErrorMessage } from "@/lib/errors";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const NONE_VALUE = "__none__";

function CategoryDialog({ category, categories }: { category?: CategorySummary; categories: CategorySummary[] }) {
  const [open, setOpen] = useState(false);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isEdit = !!category;

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: category?.name ?? "", parentId: category?.parentId ?? undefined },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: category?.name ?? "", parentId: category?.parentId ?? undefined });
    }
  }, [open, category, form]);

  function onSubmit(values: CreateCategoryInput) {
    const input = { ...values, parentId: values.parentId || null };
    const mutation = isEdit
      ? updateCategory.mutateAsync({ id: category.id, input })
      : createCategory.mutateAsync(input);

    mutation
      .then(() => {
        toast.success(isEdit ? "Category updated" : "Category added");
        setOpen(false);
      })
      .catch((error) => toast.error(getErrorMessage(error, "Failed to save category")));
  }

  const isPending = createCategory.isPending || updateCategory.isPending;
  const parentOptions = categories.filter((c) => c.id !== category?.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="mr-2 size-4" />
            Add category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "Add a category"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent category (optional)</FormLabel>
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
                      {parentOptions.map((c) => (
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
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BrandDialog({ brand }: { brand?: BrandSummary }) {
  const [open, setOpen] = useState(false);
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const isEdit = !!brand;

  const form = useForm<CreateBrandInput>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: { name: brand?.name ?? "" },
  });

  useEffect(() => {
    if (open) form.reset({ name: brand?.name ?? "" });
  }, [open, brand, form]);

  function onSubmit(values: CreateBrandInput) {
    const mutation = isEdit
      ? updateBrand.mutateAsync({ id: brand.id, input: values })
      : createBrand.mutateAsync(values);

    mutation
      .then(() => {
        toast.success(isEdit ? "Brand updated" : "Brand added");
        setOpen(false);
      })
      .catch((error) => toast.error(getErrorMessage(error, "Failed to save brand")));
  }

  const isPending = createBrand.isPending || updateBrand.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="mr-2 size-4" />
            Add brand
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit brand" : "Add a brand"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function CatalogPage() {
  const categories = useCategories();
  const brands = useBrands();
  const deleteCategory = useDeleteCategory();
  const deleteBrand = useDeleteBrand();
  const [pendingDelete, setPendingDelete] = useState<{ kind: "category" | "brand"; id: string; name: string } | null>(
    null,
  );
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());

  const topLevelCategories = (categories.data ?? []).filter((c) => !c.parentId);
  const childrenByParentId = new Map<string, CategorySummary[]>();
  for (const category of categories.data ?? []) {
    if (category.parentId) {
      const siblings = childrenByParentId.get(category.parentId) ?? [];
      siblings.push(category);
      childrenByParentId.set(category.parentId, siblings);
    }
  }

  function toggleCategoryExpanded(id: string) {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const mutation =
      pendingDelete.kind === "category"
        ? deleteCategory.mutateAsync(pendingDelete.id)
        : deleteBrand.mutateAsync(pendingDelete.id);

    mutation
      .then(() => {
        toast.success(pendingDelete.kind === "category" ? "Category deleted" : "Brand deleted");
        setPendingDelete(null);
      })
      .catch((error) => toast.error(getErrorMessage(error, "Failed to delete")));
  }

  return (
    <div>
      <PageHeader title="Categories & Brands" description="Organize your product catalog." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Categories</CardTitle>
            <CategoryDialog categories={categories.data ?? []} />
          </CardHeader>
          <CardContent>
            {categories.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : categories.data && categories.data.length === 0 ? (
              <EmptyState icon={Tags} title="No categories yet" />
            ) : (
              <div className="divide-y rounded-lg border">
                {topLevelCategories.map((category) => {
                  const children = childrenByParentId.get(category.id) ?? [];
                  const isExpanded = expandedCategoryIds.has(category.id);

                  return (
                    <div key={category.id}>
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <button
                          type="button"
                          disabled={children.length === 0}
                          onClick={() => toggleCategoryExpanded(category.id)}
                          className="flex items-center gap-2 text-left disabled:cursor-default"
                        >
                          {children.length > 0 ? (
                            isExpanded ? (
                              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                            )
                          ) : (
                            <span className="inline-block size-4 shrink-0" />
                          )}
                          <span className="text-sm font-medium">{category.name}</span>
                          {children.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({children.length})
                            </span>
                          )}
                        </button>
                        <div className="flex items-center gap-1">
                          <CategoryDialog category={category} categories={categories.data ?? []} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setPendingDelete({ kind: "category", id: category.id, name: category.name })
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      {isExpanded &&
                        children.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between border-t bg-muted/30 py-2.5 pl-11 pr-4"
                          >
                            <p className="text-sm">{child.name}</p>
                            <div className="flex items-center gap-1">
                              <CategoryDialog category={child} categories={categories.data ?? []} />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setPendingDelete({ kind: "category", id: child.id, name: child.name })
                                }
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Brands</CardTitle>
            <BrandDialog />
          </CardHeader>
          <CardContent>
            {brands.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : brands.data && brands.data.length === 0 ? (
              <EmptyState icon={Tag} title="No brands yet" />
            ) : (
              <div className="divide-y rounded-lg border">
                {brands.data?.map((brand) => (
                  <div key={brand.id} className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-sm font-medium">{brand.name}</p>
                    <div className="flex items-center gap-1">
                      <BrandDialog brand={brand} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingDelete({ kind: "brand", id: brand.id, name: brand.name })}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.name}?`}
        description="Products using this will no longer be tagged with it. This can't be undone."
        confirmLabel="Delete"
        destructive
        isLoading={deleteCategory.isPending || deleteBrand.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
