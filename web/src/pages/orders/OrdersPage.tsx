import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Users,
} from "lucide-react";
import {
  createCustomerSchema,
  createOrderSchema,
  formatBillNumber,
  ORDER_CHANNELS,
  ORDER_CHANNEL_LABELS,
  ORDER_PAYMENT_STATUSES,
  ORDER_PAYMENT_STATUS_LABELS,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type CreateCustomerInput,
  type CreateOrderInput,
  type CustomerSummary,
  type OrderChannelValue,
  type OrderPaymentStatusValue,
  type OrderRecord,
  type OrderStatusValue,
  type UpdateOrderInput,
} from "@wealthify/shared";
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/features/customers/hooks";
import {
  useCreateOrder,
  useDeleteOrder,
  useOrderSummary,
  useOrders,
  useUpdateOrder,
} from "@/features/orders/hooks";
import { getOrderBillBlob } from "@/features/orders/api";
import { useProducts } from "@/features/products/hooks";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/format";
import { toDateInputValue, parseDateInputValue } from "@/lib/date";
import { getPeriodRange, type Period } from "@/lib/period";
import { useRowSelection } from "@/hooks/useRowSelection";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { BulkActionBar } from "@/components/common/BulkActionBar";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  SortableTableHead,
  type SortDirection,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const ORDER_PAGE_SIZE = 15;

// CANCELLED isn't selectable directly — it only happens via the dedicated
// Cancel action (which also restores stock), never a plain status pick.
const ACTIVE_ORDER_STATUSES = ORDER_STATUSES.filter((s) => s !== "CANCELLED");

interface VariantOption {
  variantId: string;
  label: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
}

function channelLabel(channel: string): string {
  return ORDER_CHANNEL_LABELS[channel as OrderChannelValue] ?? channel;
}

function OrderDialog({
  order,
  customers,
  variantOptions,
}: {
  order?: OrderRecord;
  customers: CustomerSummary[];
  variantOptions: VariantOption[];
}) {
  const [open, setOpen] = useState(false);
  const [customerInput, setCustomerInput] = useState(order?.customer?.name ?? "");
  const [customerError, setCustomerError] = useState<string | null>(null);
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const createCustomer = useCreateCustomer();
  const isEdit = !!order;

  // customerId is resolved separately (see resolveCustomerId), same pattern
  // as the raw material field on the purchases dialog — the field below can
  // either pick an existing customer or type a brand new one.
  const orderFieldsSchema = createOrderSchema.omit({ customerId: true });
  type OrderFieldsInput = z.infer<typeof orderFieldsSchema>;

  const defaultValues: OrderFieldsInput = order
    ? {
        orderDate: new Date(order.orderDate),
        channel: order.channel as OrderFieldsInput["channel"],
        status: order.status as OrderFieldsInput["status"],
        paymentStatus: order.paymentStatus as OrderFieldsInput["paymentStatus"],
        notes: order.notes ?? "",
        items: order.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
      }
    : {
        orderDate: new Date(),
        channel: "OFFLINE",
        status: "COMPLETED",
        paymentStatus: "UNPAID",
        notes: "",
        items: [{ variantId: "", quantity: 1, unitPrice: 0 }],
      };

  const form = useForm<OrderFieldsInput>({
    resolver: zodResolver(orderFieldsSchema),
    defaultValues,
  });

  const itemsArray = useFieldArray({ control: form.control, name: "items" });

  useEffect(() => {
    if (open) {
      setCustomerInput(order?.customer?.name ?? "");
      setCustomerError(null);
      form.reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order, form]);

  const variantMap = useMemo(() => new Map(variantOptions.map((v) => [v.variantId, v])), [variantOptions]);
  const watchedItems = form.watch("items");

  const totals = watchedItems.reduce(
    (acc, item) => {
      const variant = variantMap.get(item.variantId);
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      acc.amount += qty * price;
      if (variant) acc.profit += qty * (price - variant.costPrice);
      return acc;
    },
    { amount: 0, profit: 0 },
  );

  const isNewCustomer =
    customerInput.trim().length > 0 &&
    !customers.some((c) => c.name.toLowerCase() === customerInput.trim().toLowerCase());

  // Customer is optional on an order — an empty field just means "no
  // customer", it's only an error if creating a brand new one fails.
  async function resolveCustomerId(): Promise<{ ok: true; customerId: string | null } | { ok: false }> {
    const trimmed = customerInput.trim();
    if (!trimmed) return { ok: true, customerId: null };

    const existing = customers.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return { ok: true, customerId: existing.id };

    try {
      const created = await createCustomer.mutateAsync({ name: trimmed });
      return { ok: true, customerId: created.id };
    } catch (error) {
      setCustomerError(getErrorMessage(error, "Failed to add customer"));
      return { ok: false };
    }
  }

  async function onSubmit(values: OrderFieldsInput) {
    const resolved = await resolveCustomerId();
    if (!resolved.ok) return;

    if (isEdit && order) {
      const payload: UpdateOrderInput = { ...values, customerId: resolved.customerId };
      updateOrder.mutate(
        { id: order.id, input: payload },
        {
          onSuccess: () => {
            toast.success("Order updated");
            setOpen(false);
          },
          onError: (error) => toast.error(getErrorMessage(error, "Failed to update order")),
        },
      );
      return;
    }

    const payload: CreateOrderInput = { ...values, customerId: resolved.customerId };
    createOrder.mutate(payload, {
      onSuccess: () => {
        toast.success("Order logged");
        setOpen(false);
      },
      onError: (error) => toast.error(getErrorMessage(error, "Failed to log order")),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm">
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 size-4" />
            Log a sale
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit order" : "Log a sale"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Customer (optional)</label>
                <Input
                  className="mt-1.5"
                  list="order-customer-options"
                  placeholder="Type or select a customer"
                  value={customerInput}
                  onChange={(e) => {
                    setCustomerInput(e.target.value);
                    setCustomerError(null);
                  }}
                />
                <datalist id="order-customer-options">
                  {customers.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
                {customerError ? (
                  <p className="mt-1.5 text-sm text-destructive">{customerError}</p>
                ) : (
                  isNewCustomer && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      &ldquo;{customerInput.trim()}&rdquo; will be added as a new customer.
                    </p>
                  )
                )}
              </div>
              <FormField
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORDER_CHANNELS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {ORDER_CHANNEL_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVE_ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {ORDER_STATUS_LABELS[s]}
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
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORDER_PAYMENT_STATUSES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {ORDER_PAYMENT_STATUS_LABELS[p]}
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
              name="orderDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order date</FormLabel>
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

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">Items</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => itemsArray.append({ variantId: "", quantity: 1, unitPrice: 0 })}
                >
                  <Plus className="mr-2 size-4" />
                  Add item
                </Button>
              </div>
              <div className="space-y-3">
                {itemsArray.fields.map((field, index) => {
                  const selectedVariantId = form.watch(`items.${index}.variantId`);
                  const selected = variantMap.get(selectedVariantId);
                  return (
                    <div key={field.id} className="rounded-lg border p-3">
                      <div className="grid gap-3 sm:grid-cols-[1fr_5rem_7rem]">
                        <FormField
                          control={form.control}
                          name={`items.${index}.variantId`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Product</FormLabel>
                              <Select
                                value={f.value}
                                onValueChange={(value) => {
                                  f.onChange(value);
                                  const match = variantMap.get(value);
                                  if (match) form.setValue(`items.${index}.unitPrice`, match.sellingPrice);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a product" />
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
                          name={`items.${index}.quantity`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Qty</FormLabel>
                              <FormControl>
                                <Input type="number" step="1" min="1" {...f} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" min="0" {...f} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{selected ? `${selected.stock} in stock` : "—"}</span>
                        {itemsArray.fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => itemsArray.remove(index)}
                          >
                            <Trash2 className="size-3.5" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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

            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              <span>Total: {formatCurrency(totals.amount)}</span>
              <span className="text-muted-foreground">Profit: {formatCurrency(totals.profit)}</span>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={createOrder.isPending || updateOrder.isPending || createCustomer.isPending}
              >
                {createOrder.isPending || updateOrder.isPending || createCustomer.isPending
                  ? "Saving…"
                  : isEdit
                    ? "Save changes"
                    : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CustomerDialog({ customer }: { customer?: CustomerSummary }) {
  const [open, setOpen] = useState(false);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const isEdit = !!customer;

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: customer?.name ?? "",
        phone: customer?.phone ?? "",
        email: customer?.email ?? "",
      });
    }
  }, [open, customer, form]);

  function onSubmit(values: CreateCustomerInput) {
    const mutation = isEdit
      ? updateCustomer.mutateAsync({ id: customer.id, input: values })
      : createCustomer.mutateAsync(values);

    mutation
      .then(() => {
        toast.success(isEdit ? "Customer updated" : "Customer added");
        setOpen(false);
      })
      .catch((error) => toast.error(getErrorMessage(error, "Failed to save customer")));
  }

  const isPending = createCustomer.isPending || updateCustomer.isPending;

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
            Add customer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit customer" : "Add a customer"}</DialogTitle>
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

type OrderSortKey = "orderDate" | "totalAmount" | "totalProfit";

export function OrdersPage() {
  const [period, setPeriod] = useState<Period>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<OrderSortKey>("orderDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pendingCancel, setPendingCancel] = useState<{ id: string; label: string } | null>(null);
  const [pendingDeleteOrder, setPendingDeleteOrder] = useState<{ id: string; label: string } | null>(null);
  const [pendingDeleteCustomer, setPendingDeleteCustomer] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [downloadingBillId, setDownloadingBillId] = useState<string | null>(null);

  const customers = useCustomers();
  const deleteCustomer = useDeleteCustomer();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();
  const products = useProducts({ page: 1, pageSize: 100 });

  const variantOptions = useMemo<VariantOption[]>(() => {
    const items = products.data?.data ?? [];
    return items.flatMap((product) =>
      product.variants
        .filter((v) => v.isActive)
        .map((variant) => ({
          variantId: variant.id,
          label: product.hasVariants
            ? `${product.name} — ${variant.variantName} (${variant.sku})`
            : `${product.name} (${variant.sku})`,
          sellingPrice: Number(variant.sellingPrice),
          costPrice: Number(variant.costPrice),
          stock: variant.inventory?.quantityOnHand ?? 0,
        })),
    );
  }, [products.data]);

  const { from, to } = useMemo(() => getPeriodRange(period), [period]);

  const summary = useOrderSummary({ from, to });
  const orders = useOrders({ page, pageSize: ORDER_PAGE_SIZE });

  function confirmCancel() {
    if (!pendingCancel) return;
    updateOrder.mutate(
      { id: pendingCancel.id, input: { status: "CANCELLED" } },
      {
        onSuccess: () => {
          toast.success("Order cancelled — stock restored");
          setPendingCancel(null);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Failed to cancel order")),
      },
    );
  }

  function confirmDeleteOrder() {
    if (!pendingDeleteOrder) return;
    deleteOrder.mutate(pendingDeleteOrder.id, {
      onSuccess: () => {
        toast.success("Order deleted");
        setPendingDeleteOrder(null);
      },
      onError: (error) => toast.error(getErrorMessage(error, "Failed to delete order")),
    });
  }

  function handleStatusChange(orderId: string, status: OrderStatusValue) {
    updateOrder.mutate(
      { id: orderId, input: { status } },
      {
        onSuccess: () => toast.success("Order updated"),
        onError: (error) => toast.error(getErrorMessage(error, "Failed to update order")),
      },
    );
  }

  function handlePaymentToggle(orderId: string, current: string) {
    const next: OrderPaymentStatusValue = current === "PAID" ? "UNPAID" : "PAID";
    updateOrder.mutate(
      { id: orderId, input: { paymentStatus: next } },
      {
        onSuccess: () => toast.success(next === "PAID" ? "Marked as paid" : "Marked as unpaid"),
        onError: (error) => toast.error(getErrorMessage(error, "Failed to update payment status")),
      },
    );
  }

  async function handleDownloadBill(order: { id: string; billNumber: number | null }) {
    setDownloadingBillId(order.id);
    try {
      const blob = await getOrderBillBlob(order.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = order.billNumber ? `${formatBillNumber(order.billNumber)}.pdf` : `bill-${order.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to download bill"));
    } finally {
      setDownloadingBillId(null);
    }
  }

  function confirmDeleteCustomer() {
    if (!pendingDeleteCustomer) return;
    deleteCustomer.mutate(pendingDeleteCustomer.id, {
      onSuccess: () => {
        toast.success("Customer removed");
        setPendingDeleteCustomer(null);
      },
      onError: (error) => toast.error(getErrorMessage(error, "Failed to delete")),
    });
  }

  function toggleSort(key: OrderSortKey) {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDirection === "desc") setSortKey("orderDate");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const orderItemsRaw = orders.data?.data ?? [];
  const orderMeta = orders.data?.meta;

  // Search/sort are scoped to the currently fetched page of results — the
  // list endpoint doesn't take a search/sort param, so this is honest,
  // real filtering, just not a full-dataset search.
  const orderItems = useMemo(() => {
    const filtered = search.trim()
      ? orderItemsRaw.filter((o) => {
          const haystack = `${o.customer?.name ?? ""} ${o.items.map((i) => i.productName).join(" ")}`.toLowerCase();
          return haystack.includes(search.trim().toLowerCase());
        })
      : orderItemsRaw;

    if (!sortDirection) return filtered;
    const sorted = [...filtered].sort((a, b) => {
      let diff = 0;
      if (sortKey === "orderDate") diff = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
      else diff = Number(a[sortKey]) - Number(b[sortKey]);
      return sortDirection === "asc" ? diff : -diff;
    });
    return sorted;
  }, [orderItemsRaw, search, sortKey, sortDirection]);

  const selection = useRowSelection(orderItems.map((o) => o.id));

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Log sales made elsewhere and track revenue, profit, and stock."
        action={<OrderDialog customers={customers.data ?? []} variantOptions={variantOptions} />}
      />

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Total Sales</CardTitle>
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
          <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p className="text-3xl font-semibold">{formatCurrency(summary.data?.totalAmount ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-success">
                {formatCurrency(summary.data?.totalProfit ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">Profit</p>
            </div>
            <p className="text-sm text-muted-foreground sm:ml-auto">{summary.data?.orderCount ?? 0} orders</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {summary.data && summary.data.byProduct.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">By product</p>
                <div className="divide-y rounded-lg border">
                  {summary.data.byProduct.map((p) => (
                    <div key={p.variantId} className="flex items-center justify-between px-4 py-2">
                      <p className="text-sm">
                        {p.productName}
                        {p.variantName && p.variantName !== "Default" ? ` — ${p.variantName}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {p.totalQuantity} sold · {formatCurrency(p.totalAmount)}
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
                        {d.count} {d.count === 1 ? "order" : "orders"} · {formatCurrency(d.totalAmount)}
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
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Order history</CardTitle>
          <div className="relative w-full sm:max-w-56">
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
          {orders.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : orderItems.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title={search ? "No orders match your search" : "No orders logged yet"}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all orders on this page"
                      checked={selection.allSelected}
                      onChange={selection.toggleAll}
                      className="size-4 rounded border-input"
                    />
                  </TableHead>
                  <TableHead>Bill #</TableHead>
                  <SortableTableHead
                    sortDirection={sortKey === "orderDate" ? sortDirection : null}
                    onSort={() => toggleSort("orderDate")}
                  >
                    Date
                  </SortableTableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Items</TableHead>
                  <SortableTableHead
                    sortDirection={sortKey === "totalAmount" ? sortDirection : null}
                    onSort={() => toggleSort("totalAmount")}
                  >
                    Total
                  </SortableTableHead>
                  <SortableTableHead
                    sortDirection={sortKey === "totalProfit" ? sortDirection : null}
                    onSort={() => toggleSort("totalProfit")}
                  >
                    Profit
                  </SortableTableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((order) => (
                  <TableRow key={order.id} data-state={selection.selected.has(order.id) ? "selected" : undefined}>
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Select order ${formatBillNumber(order.billNumber)}`}
                        checked={selection.selected.has(order.id)}
                        onChange={() => selection.toggle(order.id)}
                        className="size-4 rounded border-input"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatBillNumber(order.billNumber)}</TableCell>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground">{order.customer?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{channelLabel(order.channel)}</TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground">
                      {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell className="text-success">{formatCurrency(order.totalProfit)}</TableCell>
                    <TableCell>
                      {order.status === "CANCELLED" ? (
                        <span className="text-xs text-muted-foreground">Cancelled</span>
                      ) : (
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value as OrderStatusValue)}
                        >
                          <SelectTrigger size="sm" className="h-7 w-auto text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVE_ORDER_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {ORDER_STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        asChild
                        variant={order.paymentStatus === "PAID" ? "success" : "warning"}
                        className="cursor-pointer"
                      >
                        <button type="button" onClick={() => handlePaymentToggle(order.id, order.paymentStatus)}>
                          {ORDER_PAYMENT_STATUS_LABELS[order.paymentStatus as OrderPaymentStatusValue] ??
                            order.paymentStatus}
                        </button>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {order.status !== "CANCELLED" && (
                        <OrderDialog
                          order={order}
                          customers={customers.data ?? []}
                          variantOptions={variantOptions}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={downloadingBillId === order.id}
                        onClick={() => handleDownloadBill(order)}
                      >
                        <Download className="mr-1 size-3.5" />
                        {downloadingBillId === order.id ? "Preparing…" : "Bill"}
                      </Button>
                      {order.status !== "CANCELLED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setPendingCancel({
                              id: order.id,
                              label: `this order from ${new Date(order.orderDate).toLocaleDateString()}`,
                            })
                          }
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          setPendingDeleteOrder({
                            id: order.id,
                            label: `this order from ${new Date(order.orderDate).toLocaleDateString()}`,
                          })
                        }
                      >
                        <Trash2 className="mr-1 size-3.5" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {orderMeta && orderMeta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {orderMeta.page} of {orderMeta.totalPages}
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
                  disabled={page >= orderMeta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Customers</CardTitle>
          <CustomerDialog />
        </CardHeader>
        <CardContent>
          {customers.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : customers.data && customers.data.length === 0 ? (
            <EmptyState icon={Users} title="No customers yet" />
          ) : (
            <div className="divide-y rounded-lg border">
              {customers.data?.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{customer.name}</p>
                    {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <CustomerDialog customer={customer} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDeleteCustomer({ id: customer.id, name: customer.name })}
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

      <BulkActionBar
        count={selection.count}
        actions={[{ label: "Export" }, { label: "Print bills" }]}
        onClear={selection.clear}
      />

      <ConfirmDialog
        open={!!pendingCancel}
        onOpenChange={(open) => !open && setPendingCancel(null)}
        title={`Cancel ${pendingCancel?.label}?`}
        description="This restores the stock it decremented. This can't be undone."
        confirmLabel="Cancel order"
        destructive
        isLoading={updateOrder.isPending}
        onConfirm={confirmCancel}
      />
      <ConfirmDialog
        open={!!pendingDeleteOrder}
        onOpenChange={(open) => !open && setPendingDeleteOrder(null)}
        title={`Delete ${pendingDeleteOrder?.label}?`}
        description="This permanently removes the order and its bill record. If it hasn't been cancelled yet, its stock is restored first. This can't be undone."
        confirmLabel="Delete order"
        destructive
        isLoading={deleteOrder.isPending}
        onConfirm={confirmDeleteOrder}
      />
      <ConfirmDialog
        open={!!pendingDeleteCustomer}
        onOpenChange={(open) => !open && setPendingDeleteCustomer(null)}
        title={`Delete ${pendingDeleteCustomer?.name}?`}
        description="This can't be undone."
        confirmLabel="Delete"
        destructive
        isLoading={deleteCustomer.isPending}
        onConfirm={confirmDeleteCustomer}
      />
    </div>
  );
}
