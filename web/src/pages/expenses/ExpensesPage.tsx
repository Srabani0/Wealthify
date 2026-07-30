import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Receipt, Search } from "lucide-react";
import { createExpenseSchema, type CreateExpenseInput, type ExpenseRecord } from "@wealthify/shared";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenseSummary,
  useExpenses,
  useUpdateExpense,
} from "@/features/expenses/hooks";
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

const EXPENSE_PAGE_SIZE = 15;

function ExpenseDialog({ expense }: { expense?: ExpenseRecord }) {
  const [open, setOpen] = useState(false);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const isEdit = !!expense;

  const defaultValues: CreateExpenseInput = {
    expenseDate: expense ? new Date(expense.expenseDate) : new Date(),
    description: expense?.description ?? "",
    amount: expense ? Number(expense.amount) : 0,
    notes: expense?.notes ?? "",
  };

  const form = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense, form]);

  function onSubmit(values: CreateExpenseInput) {
    const mutation = isEdit
      ? updateExpense.mutateAsync({ id: expense.id, input: values })
      : createExpense.mutateAsync(values);

    mutation
      .then(() => {
        toast.success(isEdit ? "Expense updated" : "Expense logged");
        setOpen(false);
      })
      .catch((error) => toast.error(getErrorMessage(error, "Failed to save expense")));
  }

  const isPending = createExpense.isPending || updateExpense.isPending;

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
            Log expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit expense" : "Log an expense"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Shop rent, Electricity bill" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

export function ExpensesPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const deleteExpense = useDeleteExpense();

  const { from, to } = useMemo(() => getPeriodRange(period), [period]);

  const summary = useExpenseSummary({ from, to });
  const expenses = useExpenses({ page, pageSize: EXPENSE_PAGE_SIZE });

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteExpense.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success("Expense deleted");
        setPendingDelete(null);
      },
      onError: (error) => toast.error(getErrorMessage(error, "Failed to delete expense")),
    });
  }

  const expenseItemsRaw = expenses.data?.data ?? [];
  const expenseMeta = expenses.data?.meta;
  const expenseItems = useMemo(() => {
    if (!search.trim()) return expenseItemsRaw;
    const needle = search.trim().toLowerCase();
    return expenseItemsRaw.filter(
      (e) => e.description.toLowerCase().includes(needle) || e.notes?.toLowerCase().includes(needle),
    );
  }, [expenseItemsRaw, search]);

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Log business expenses like rent, utilities, and packaging."
        action={<ExpenseDialog />}
      />

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Total Expenses</CardTitle>
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
            <p className="text-sm text-muted-foreground">{summary.data?.expenseCount ?? 0} expenses</p>
          </div>
          {summary.data && summary.data.byDay.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">By day</p>
              <div className="max-h-64 divide-y overflow-y-auto rounded-lg border">
                {summary.data.byDay.map((d) => (
                  <div key={d.date} className="flex items-center justify-between px-4 py-2">
                    <p className="text-sm">{new Date(d.date).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {d.count} {d.count === 1 ? "expense" : "expenses"} · {formatCurrency(d.totalAmount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Expense history</CardTitle>
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
          {expenses.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : expenseItems.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={search ? "No expenses match your search" : "No expenses logged yet"}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseItems.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-muted-foreground">{expense.notes ?? "—"}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <ExpenseDialog expense={expense} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingDelete({ id: expense.id, name: `"${expense.description}"` })}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {expenseMeta && expenseMeta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {expenseMeta.page} of {expenseMeta.totalPages}
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
                  disabled={page >= expenseMeta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete ${pendingDelete?.name}?`}
        description="This can't be undone."
        confirmLabel="Delete"
        destructive
        isLoading={deleteExpense.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
