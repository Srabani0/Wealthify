import { Prisma } from "@prisma/client";
import type { CreateExpenseInput, ExpenseListQueryInput, UpdateExpenseInput } from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import { NotFoundError } from "../../lib/errors.js";

export async function listExpenses(businessId: string, query: ExpenseListQueryInput) {
  const where: Prisma.ExpenseWhereInput = {
    businessId,
    ...(query.from || query.to
      ? {
          expenseDate: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.expense.count({ where }),
  ]);

  return { items, total };
}

export async function createExpense(businessId: string, input: CreateExpenseInput) {
  return prisma.expense.create({
    data: {
      businessId,
      expenseDate: input.expenseDate ?? new Date(),
      description: input.description,
      amount: input.amount,
      notes: input.notes ?? null,
    },
  });
}

export async function updateExpense(businessId: string, id: string, input: UpdateExpenseInput) {
  const expense = await prisma.expense.findFirst({ where: { id, businessId } });
  if (!expense) throw new NotFoundError("Expense not found");

  return prisma.expense.update({ where: { id }, data: input });
}

export async function deleteExpense(businessId: string, id: string) {
  const expense = await prisma.expense.findFirst({ where: { id, businessId } });
  if (!expense) throw new NotFoundError("Expense not found");

  // Hard delete — this row is the record itself, nothing downstream
  // references it (same reasoning as RawMaterialPurchase).
  await prisma.expense.delete({ where: { id } });
}

export async function getExpenseSummary(businessId: string, from?: Date, to?: Date) {
  const where: Prisma.ExpenseWhereInput = {
    businessId,
    ...(from || to
      ? {
          expenseDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [totalAgg, dayRows] = await Promise.all([
    prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true }),
    prisma.expense.findMany({ where, select: { expenseDate: true, amount: true } }),
  ]);

  const byDayMap = new Map<string, { totalAmount: number; count: number }>();
  for (const row of dayRows) {
    const dayKey = row.expenseDate.toISOString().slice(0, 10);
    const entry = byDayMap.get(dayKey) ?? { totalAmount: 0, count: 0 };
    entry.totalAmount += Number(row.amount);
    entry.count += 1;
    byDayMap.set(dayKey, entry);
  }
  const byDay = Array.from(byDayMap.entries())
    .map(([date, v]) => ({ date, totalAmount: Math.round(v.totalAmount * 100) / 100, count: v.count }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 31);

  return {
    totalAmount: totalAgg._sum.amount ?? 0,
    expenseCount: totalAgg._count,
    byDay,
  };
}
