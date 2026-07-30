import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Package, Plus, Search } from "lucide-react";
import { useCategories } from "@/features/categories/hooks";
import { useBrands } from "@/features/brands/hooks";
import { useDeleteProduct, useProducts } from "@/features/products/hooks";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/format";
import { useRowSelection } from "@/hooks/useRowSelection";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { BulkActionBar } from "@/components/common/BulkActionBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  SortableTableHead,
  type SortDirection,
} from "@/components/ui/table";

const PAGE_SIZE = 20;
const ALL_VALUE = "__all__";

type ProductSortKey = "name" | "price" | "stock";

export function ProductsListPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [sortKey, setSortKey] = useState<ProductSortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const categories = useCategories();
  const brands = useBrands();
  const products = useProducts({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    categoryId: categoryId || undefined,
    brandId: brandId || undefined,
  });
  const deleteProduct = useDeleteProduct();

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteProduct.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success("Product deleted");
        setPendingDelete(null);
      },
      onError: (error) => toast.error(getErrorMessage(error, "Failed to delete product")),
    });
  }

  function toggleSort(key: ProductSortKey) {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const itemsRaw = products.data?.data ?? [];
  const meta = products.data?.meta;

  const rows = useMemo(() => {
    const withDerived = itemsRaw.map((product) => {
      const prices = product.variants.map((v) => Number(v.sellingPrice));
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;
      const totalStock = product.variants.reduce((sum, v) => sum + (v.inventory?.quantityOnHand ?? 0), 0);
      const isLowStock = product.variants.some(
        (v) => (v.inventory?.quantityOnHand ?? 0) <= v.lowStockThreshold,
      );
      return { product, minPrice, maxPrice, totalStock, isLowStock };
    });

    if (!sortDirection) return withDerived;
    const sorted = [...withDerived].sort((a, b) => {
      let diff = 0;
      if (sortKey === "name") diff = a.product.name.localeCompare(b.product.name);
      else if (sortKey === "price") diff = a.minPrice - b.minPrice;
      else diff = a.totalStock - b.totalStock;
      return sortDirection === "asc" ? diff : -diff;
    });
    return sorted;
  }, [itemsRaw, sortKey, sortDirection]);

  const selection = useRowSelection(rows.map((r) => r.product.id));

  return (
    <div>
      <PageHeader
        title="Products"
        description="Your product catalog, variants, and stock at a glance."
        action={
          <Button asChild>
            <Link to="/products/new">
              <Plus className="mr-2 size-4" />
              Add product
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form onSubmit={onSearchSubmit} className="relative min-w-50 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products…"
            className="pl-8"
          />
        </form>
        <Select
          value={categoryId || ALL_VALUE}
          onValueChange={(value) => {
            setPage(1);
            setCategoryId(value === ALL_VALUE ? "" : value);
          }}
        >
          <SelectTrigger className="w-auto">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All categories</SelectItem>
            {categories.data?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={brandId || ALL_VALUE}
          onValueChange={(value) => {
            setPage(1);
            setBrandId(value === ALL_VALUE ? "" : value);
          }}
        >
          <SelectTrigger className="w-auto">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All brands</SelectItem>
            {brands.data?.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {products.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? "No products match your search" : "No products yet"}
          description={
            search ? undefined : "Add your first product to start tracking stock and pricing."
          }
          action={
            !search && (
              <Button asChild>
                <Link to="/products/new">
                  <Plus className="mr-2 size-4" />
                  Add product
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <input
                  type="checkbox"
                  aria-label="Select all products on this page"
                  checked={selection.allSelected}
                  onChange={selection.toggleAll}
                  className="size-4 rounded border-input"
                />
              </TableHead>
              <SortableTableHead sortDirection={sortKey === "name" ? sortDirection : null} onSort={() => toggleSort("name")}>
                Product
              </SortableTableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <SortableTableHead sortDirection={sortKey === "price" ? sortDirection : null} onSort={() => toggleSort("price")}>
                Price
              </SortableTableHead>
              <SortableTableHead sortDirection={sortKey === "stock" ? sortDirection : null} onSort={() => toggleSort("stock")}>
                Stock
              </SortableTableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ product, minPrice, maxPrice, totalStock, isLowStock }) => (
              <TableRow
                key={product.id}
                data-state={selection.selected.has(product.id) ? "selected" : undefined}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Select ${product.name}`}
                    checked={selection.selected.has(product.id)}
                    onChange={() => selection.toggle(product.id)}
                    className="size-4 rounded border-input"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                      {product.images[0] ? (
                        <img src={product.images[0].url} alt="" className="size-full object-cover" />
                      ) : (
                        <Package className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <Link to={`/products/${product.id}/edit`} className="font-medium hover:underline">
                        {product.name}
                      </Link>
                      {product.hasVariants && (
                        <p className="text-xs text-muted-foreground">{product.variants.length} variants</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{product.category?.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{product.brand?.name ?? "—"}</TableCell>
                <TableCell>
                  {minPrice === maxPrice
                    ? formatCurrency(minPrice)
                    : `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`}
                </TableCell>
                <TableCell>
                  <Badge variant={isLowStock ? "warning" : "secondary"}>
                    {totalStock} {product.unit}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/products/${product.id}/edit`}>Edit</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingDelete({ id: product.id, name: product.name })}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages} ({meta.total} products)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <BulkActionBar
        count={selection.count}
        actions={[{ label: "Archive" }, { label: "Export" }]}
        onClear={selection.clear}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.name}?`}
        description="This product will be removed from your active catalog. This can't be undone."
        confirmLabel="Delete"
        destructive
        isLoading={deleteProduct.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
