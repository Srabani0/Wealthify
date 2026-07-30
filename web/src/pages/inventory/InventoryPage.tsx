import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AlertTriangle, ChevronLeft, ChevronRight, History, PackageCheck } from "lucide-react";
import { stockAdjustmentSchema, type StockAdjustmentInput } from "@wealthify/shared";
import { useProducts } from "@/features/products/hooks";
import { useAdjustStock, useLowStock, useStockMovements } from "@/features/inventory/hooks";
import { getErrorMessage } from "@/lib/errors";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const MOVEMENT_PAGE_SIZE = 15;

function AdjustStockDialog({
  variantId,
  triggerLabel = "Adjust stock",
  variantOptions,
}: {
  variantId?: string;
  triggerLabel?: string;
  variantOptions: { variantId: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const adjustStock = useAdjustStock();

  const form = useForm<StockAdjustmentInput>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: { variantId: variantId ?? "", type: "ADJUSTMENT_IN", quantity: 1, reason: "" },
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      form.reset({ variantId: variantId ?? "", type: "ADJUSTMENT_IN", quantity: 1, reason: "" });
    }
  }

  function onSubmit(values: StockAdjustmentInput) {
    adjustStock.mutate(values, {
      onSuccess: () => {
        toast.success("Stock adjusted");
        setOpen(false);
      },
      onError: (error) => toast.error(getErrorMessage(error, "Failed to adjust stock")),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant={variantId ? "outline" : "default"}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="variantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product variant</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!!variantId}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a variant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {variantOptions.map((v) => (
                        <SelectItem key={v.variantId} value={v.variantId}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direction</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADJUSTMENT_IN">Stock in (+)</SelectItem>
                      <SelectItem value="ADJUSTMENT_OUT">Stock out (-)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Stock count correction" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={adjustStock.isPending}>
                {adjustStock.isPending ? "Saving…" : "Save adjustment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function InventoryPage() {
  const [movementPage, setMovementPage] = useState(1);
  const products = useProducts({ page: 1, pageSize: 100 });
  const lowStock = useLowStock();
  const movements = useStockMovements({ page: movementPage, pageSize: MOVEMENT_PAGE_SIZE });

  const variantOptions = useMemo(() => {
    const items = products.data?.data ?? [];
    return items.flatMap((product) =>
      product.variants.map((variant) => ({
        variantId: variant.id,
        label: product.hasVariants
          ? `${product.name} — ${variant.variantName} (${variant.sku})`
          : `${product.name} (${variant.sku})`,
      })),
    );
  }, [products.data]);

  const variantLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of variantOptions) map.set(option.variantId, option.label);
    return map;
  }, [variantOptions]);

  const movementItems = movements.data?.data ?? [];
  const movementMeta = movements.data?.meta;

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Stock levels, adjustments, and movement history."
        action={<AdjustStockDialog variantOptions={variantOptions} />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-warning" />
              Low stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : lowStock.data && lowStock.data.length === 0 ? (
              <EmptyState icon={PackageCheck} title="Everything is well stocked" />
            ) : (
              <div className="divide-y rounded-lg border">
                {lowStock.data?.map((item) => (
                  <div key={item.variantId} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium">
                        {item.productName}
                        {item.variantName !== "Default" && ` — ${item.variantName}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={item.quantityOnHand <= 0 ? "destructive" : "warning"}>
                        {item.quantityOnHand} / {item.lowStockThreshold}
                      </Badge>
                      <AdjustStockDialog
                        variantId={item.variantId}
                        triggerLabel="Adjust"
                        variantOptions={variantOptions}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" />
              Recent stock movements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {movements.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : movementItems.length === 0 ? (
              <EmptyState icon={History} title="No stock movements yet" />
            ) : (
              <div className="divide-y rounded-lg border">
                {movementItems.map((movement) => (
                  <div key={movement.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {variantLookup.get(movement.variantId) ?? movement.variantId}
                      </p>
                      <Badge variant={movement.type.endsWith("IN") ? "success" : "secondary"}>
                        {movement.type.endsWith("IN") ? "+" : "-"}
                        {movement.quantity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(movement.createdAt).toLocaleString()}
                      {movement.reason ? ` — ${movement.reason}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {movementMeta && movementMeta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {movementMeta.page} of {movementMeta.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={movementPage <= 1}
                    onClick={() => setMovementPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={movementPage >= movementMeta.totalPages}
                    onClick={() => setMovementPage((p) => p + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
