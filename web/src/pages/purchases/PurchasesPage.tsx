import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Package2, Plus, Receipt, Search, Truck } from "lucide-react";
import {
  createPurchaseSchema,
  createRawMaterialSchema,
  createSupplierSchema,
  DEFAULT_UNITS,
  DEFAULT_UNIT,
  type CreatePurchaseInput,
  type CreateRawMaterialInput,
  type CreateSupplierInput,
  type PurchaseRecord,
  type RawMaterialSummary,
  type SupplierSummary,
} from "@wealthify/shared";
import {
  useCreateRawMaterial,
  useDeleteRawMaterial,
  useRawMaterials,
  useUpdateRawMaterial,
} from "@/features/raw-materials/hooks";
import {
  useCreateSupplier,
  useDeleteSupplier,
  useSuppliers,
  useUpdateSupplier,
} from "@/features/suppliers/hooks";
import {
  useCreatePurchase,
  useDeletePurchase,
  usePurchaseSummary,
  usePurchases,
  useUpdatePurchase,
} from "@/features/purchases/hooks";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/format";
import { toDateInputValue, parseDateInputValue } from "@/lib/date";
import { getPeriodRange, type Period } from "@/lib/period";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
const PURCHASE_PAGE_SIZE = 15;

function PurchaseDialog({
  purchase,
  rawMaterials,
  suppliers,
}: {
  purchase?: PurchaseRecord;
  rawMaterials: RawMaterialSummary[];
  suppliers: SupplierSummary[];
}) {
  const [open, setOpen] = useState(false);
  const [materialInput, setMaterialInput] = useState(purchase?.rawMaterial.name ?? "");
  const [materialError, setMaterialError] = useState<string | null>(null);
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();
  const createRawMaterial = useCreateRawMaterial();
  const isEdit = !!purchase;

  // rawMaterialId is resolved separately (see resolveRawMaterialId) since
  // the field below can either pick an existing material or type a brand
  // new one — react-hook-form only owns the rest of the purchase fields.
  const purchaseFieldsSchema = createPurchaseSchema.omit({ rawMaterialId: true });
  type PurchaseFieldsInput = z.infer<typeof purchaseFieldsSchema>;

  const form = useForm<PurchaseFieldsInput>({
    resolver: zodResolver(purchaseFieldsSchema),
    defaultValues: {
      supplierId: purchase?.supplierId ?? undefined,
      purchaseDate: purchase ? new Date(purchase.purchaseDate) : new Date(),
      quantity: purchase ? Number(purchase.quantity) : 1,
      unit: purchase?.unit ?? DEFAULT_UNIT,
      pricePerUnit: purchase ? Number(purchase.pricePerUnit) : 0,
      notes: purchase?.notes ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      setMaterialInput(purchase?.rawMaterial.name ?? "");
      setMaterialError(null);
      form.reset({
        supplierId: purchase?.supplierId ?? undefined,
        purchaseDate: purchase ? new Date(purchase.purchaseDate) : new Date(),
        quantity: purchase ? Number(purchase.quantity) : 1,
        unit: purchase?.unit ?? DEFAULT_UNIT,
        pricePerUnit: purchase ? Number(purchase.pricePerUnit) : 0,
        notes: purchase?.notes ?? "",
      });
    }
  }, [open, purchase, form]);

  async function resolveRawMaterialId(): Promise<string | null> {
    const trimmed = materialInput.trim();
    if (!trimmed) {
      setMaterialError("Type or select a raw material");
      return null;
    }

    const existing = rawMaterials.find((m) => m.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;

    try {
      const created = await createRawMaterial.mutateAsync({
        name: trimmed,
        defaultUnit: form.getValues("unit"),
      });
      return created.id;
    } catch (error) {
      setMaterialError(getErrorMessage(error, "Failed to add raw material"));
      return null;
    }
  }

  async function onSubmit(values: PurchaseFieldsInput) {
    const rawMaterialId = await resolveRawMaterialId();
    if (!rawMaterialId) return;

    const payload: CreatePurchaseInput = { ...values, rawMaterialId };
    const mutation = isEdit
      ? updatePurchase.mutateAsync({ id: purchase.id, input: payload })
      : createPurchase.mutateAsync(payload);

    mutation
      .then(() => {
        toast.success(isEdit ? "Purchase updated" : "Purchase logged");
        setOpen(false);
      })
      .catch((error) => toast.error(getErrorMessage(error, "Failed to save purchase")));
  }

  const isPending = createPurchase.isPending || updatePurchase.isPending || createRawMaterial.isPending;
  const quantity = form.watch("quantity");
  const pricePerUnit = form.watch("pricePerUnit");
  const totalPreview = (Number(quantity) || 0) * (Number(pricePerUnit) || 0);
  const isNewMaterial =
    materialInput.trim().length > 0 &&
    !rawMaterials.some((m) => m.name.toLowerCase() === materialInput.trim().toLowerCase());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 size-4" />
            Log purchase
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit purchase" : "Log a purchase"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Raw material</label>
              <Input
                className="mt-1.5"
                list="raw-material-options"
                placeholder="Type or select a material"
                value={materialInput}
                onChange={(e) => {
                  setMaterialInput(e.target.value);
                  setMaterialError(null);
                  const match = rawMaterials.find(
                    (m) => m.name.toLowerCase() === e.target.value.trim().toLowerCase(),
                  );
                  if (match) form.setValue("unit", match.defaultUnit);
                }}
              />
              <datalist id="raw-material-options">
                {rawMaterials.map((m) => (
                  <option key={m.id} value={m.name} />
                ))}
              </datalist>
              {materialError ? (
                <p className="mt-1.5 text-sm text-destructive">{materialError}</p>
              ) : (
                isNewMaterial && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    &ldquo;{materialInput.trim()}&rdquo; will be added as a new raw material.
                  </p>
                )
              )}
            </div>
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier (optional)</FormLabel>
                  <Select
                    value={field.value || NONE_VALUE}
                    onValueChange={(value) => field.onChange(value === NONE_VALUE ? undefined : value)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>None</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
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
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={toDateInputValue(field.value)}
                      onChange={(e) => field.onChange(parseDateInputValue(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
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
            </div>
            <FormField
              control={form.control}
              name="pricePerUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per unit</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalPreview)}</p>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
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

function RawMaterialDialog({ material }: { material?: RawMaterialSummary }) {
  const [open, setOpen] = useState(false);
  const createRawMaterial = useCreateRawMaterial();
  const updateRawMaterial = useUpdateRawMaterial();
  const isEdit = !!material;

  const form = useForm<CreateRawMaterialInput>({
    resolver: zodResolver(createRawMaterialSchema),
    defaultValues: { name: material?.name ?? "", defaultUnit: material?.defaultUnit ?? DEFAULT_UNIT },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: material?.name ?? "", defaultUnit: material?.defaultUnit ?? DEFAULT_UNIT });
    }
  }, [open, material, form]);

  function onSubmit(values: CreateRawMaterialInput) {
    const mutation = isEdit
      ? updateRawMaterial.mutateAsync({ id: material.id, input: values })
      : createRawMaterial.mutateAsync(values);

    mutation
      .then(() => {
        toast.success(isEdit ? "Raw material updated" : "Raw material added");
        setOpen(false);
      })
      .catch((error) => toast.error(getErrorMessage(error, "Failed to save raw material")));
  }

  const isPending = createRawMaterial.isPending || updateRawMaterial.isPending;

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
            Add material
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit raw material" : "Add a raw material"}</DialogTitle>
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
                    <Input placeholder="e.g. Satin Ribbon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default unit</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
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

function SupplierDialog({ supplier }: { supplier?: SupplierSummary }) {
  const [open, setOpen] = useState(false);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const isEdit = !!supplier;

  const form = useForm<CreateSupplierInput>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: supplier?.name ?? "",
      contactPerson: supplier?.contactPerson ?? "",
      phone: supplier?.phone ?? "",
      email: supplier?.email ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: supplier?.name ?? "",
        contactPerson: supplier?.contactPerson ?? "",
        phone: supplier?.phone ?? "",
        email: supplier?.email ?? "",
      });
    }
  }, [open, supplier, form]);

  function onSubmit(values: CreateSupplierInput) {
    const mutation = isEdit
      ? updateSupplier.mutateAsync({ id: supplier.id, input: values })
      : createSupplier.mutateAsync(values);

    mutation
      .then(() => {
        toast.success(isEdit ? "Supplier updated" : "Supplier added");
        setOpen(false);
      })
      .catch((error) => toast.error(getErrorMessage(error, "Failed to save supplier")));
  }

  const isPending = createSupplier.isPending || updateSupplier.isPending;

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
            Add supplier
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit supplier" : "Add a supplier"}</DialogTitle>
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
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact person (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} value={field.value ?? ""} />
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

export function PurchasesPage() {
  const [period, setPeriod] = useState<Period>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<
    { kind: "purchase" | "material" | "supplier"; id: string; name: string } | null
  >(null);

  const rawMaterials = useRawMaterials();
  const suppliers = useSuppliers();
  const deleteRawMaterial = useDeleteRawMaterial();
  const deleteSupplier = useDeleteSupplier();
  const deletePurchase = useDeletePurchase();

  const { from, to } = useMemo(() => getPeriodRange(period), [period]);

  const summary = usePurchaseSummary({ from, to });
  const purchases = usePurchases({ page, pageSize: PURCHASE_PAGE_SIZE });

  function confirmDelete() {
    if (!pendingDelete) return;
    const mutation =
      pendingDelete.kind === "purchase"
        ? deletePurchase.mutateAsync(pendingDelete.id)
        : pendingDelete.kind === "material"
          ? deleteRawMaterial.mutateAsync(pendingDelete.id)
          : deleteSupplier.mutateAsync(pendingDelete.id);

    mutation
      .then(() => {
        toast.success(
          pendingDelete.kind === "purchase"
            ? "Purchase deleted"
            : pendingDelete.kind === "material"
              ? "Raw material removed"
              : "Supplier removed",
        );
        setPendingDelete(null);
      })
      .catch((error) => toast.error(getErrorMessage(error, "Failed to delete")));
  }

  const purchaseItemsRaw = purchases.data?.data ?? [];
  const purchaseMeta = purchases.data?.meta;

  const purchaseItems = useMemo(() => {
    if (!search.trim()) return purchaseItemsRaw;
    const needle = search.trim().toLowerCase();
    return purchaseItemsRaw.filter(
      (p) => p.rawMaterial.name.toLowerCase().includes(needle) || p.supplier?.name.toLowerCase().includes(needle),
    );
  }, [purchaseItemsRaw, search]);

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Log raw material purchases and track your total investment."
        action={<PurchaseDialog rawMaterials={rawMaterials.data ?? []} suppliers={suppliers.data ?? []} />}
      />

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Total Investment</CardTitle>
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger size="sm" className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-baseline gap-3">
            <p className="text-3xl font-semibold">{formatCurrency(summary.data?.totalAmount ?? 0)}</p>
            <p className="text-sm text-muted-foreground">{summary.data?.purchaseCount ?? 0} purchases</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {summary.data && summary.data.byMaterial.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">By material</p>
                <div className="divide-y rounded-lg border">
                  {summary.data.byMaterial.map((m) => (
                    <div key={m.rawMaterialId} className="flex items-center justify-between px-4 py-2">
                      <p className="text-sm">{m.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {m.totalQuantity} {m.unit} · {formatCurrency(m.totalAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {summary.data && summary.data.byDay.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">By day</p>
                <div className="max-h-64 divide-y overflow-y-auto rounded-lg border">
                  {summary.data.byDay.map((d) => (
                    <div key={d.date} className="flex items-center justify-between px-4 py-2">
                      <p className="text-sm">{new Date(d.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {d.count} {d.count === 1 ? "purchase" : "purchases"} · {formatCurrency(d.totalAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Purchase history</CardTitle>
          <div className="relative w-full max-w-56">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search this page…"
              className="h-8 pl-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {purchases.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : purchaseItems.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={search ? "No purchases match your search" : "No purchases logged yet"}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price/unit</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseItems.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell>{purchase.rawMaterial.name}</TableCell>
                    <TableCell className="text-muted-foreground">{purchase.supplier?.name ?? "—"}</TableCell>
                    <TableCell>
                      {purchase.quantity} {purchase.unit}
                    </TableCell>
                    <TableCell>{formatCurrency(purchase.pricePerUnit)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(purchase.totalPrice)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <PurchaseDialog
                        purchase={purchase}
                        rawMaterials={rawMaterials.data ?? []}
                        suppliers={suppliers.data ?? []}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setPendingDelete({
                            kind: "purchase",
                            id: purchase.id,
                            name: `this purchase of ${purchase.rawMaterial.name}`,
                          })
                        }
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {purchaseMeta && purchaseMeta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {purchaseMeta.page} of {purchaseMeta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= purchaseMeta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Raw Materials</CardTitle>
            <RawMaterialDialog />
          </CardHeader>
          <CardContent>
            {rawMaterials.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : rawMaterials.data && rawMaterials.data.length === 0 ? (
              <EmptyState icon={Package2} title="No raw materials yet" />
            ) : (
              <div className="divide-y rounded-lg border">
                {rawMaterials.data?.map((material) => (
                  <div key={material.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{material.name}</p>
                      <p className="text-xs text-muted-foreground">{material.defaultUnit}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <RawMaterialDialog material={material} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setPendingDelete({ kind: "material", id: material.id, name: material.name })
                        }
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Suppliers</CardTitle>
            <SupplierDialog />
          </CardHeader>
          <CardContent>
            {suppliers.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : suppliers.data && suppliers.data.length === 0 ? (
              <EmptyState icon={Truck} title="No suppliers yet" />
            ) : (
              <div className="divide-y rounded-lg border">
                {suppliers.data?.map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{supplier.name}</p>
                      {supplier.contactPerson && (
                        <p className="text-xs text-muted-foreground">{supplier.contactPerson}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <SupplierDialog supplier={supplier} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setPendingDelete({ kind: "supplier", id: supplier.id, name: supplier.name })
                        }
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
        description="This can't be undone."
        confirmLabel="Delete"
        destructive
        isLoading={deletePurchase.isPending || deleteRawMaterial.isPending || deleteSupplier.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
