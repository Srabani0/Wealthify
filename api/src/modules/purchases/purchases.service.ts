import { Prisma } from "@prisma/client";
import type { CreatePurchaseInput, PurchaseListQueryInput, UpdatePurchaseInput } from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import { NotFoundError, ValidationError } from "../../lib/errors.js";

function computeTotalPrice(quantity: number, pricePerUnit: number): number {
  return Math.round(quantity * pricePerUnit * 100) / 100;
}

async function assertMaterialAndSupplierBelongToBusiness(
  businessId: string,
  rawMaterialId: string,
  supplierId?: string | null,
) {
  const material = await prisma.rawMaterial.findFirst({ where: { id: rawMaterialId, businessId } });
  if (!material) throw new ValidationError("Raw material not found");

  if (supplierId) {
    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, businessId } });
    if (!supplier) throw new ValidationError("Supplier not found");
  }
}

export async function listPurchases(businessId: string, query: PurchaseListQueryInput) {
  const where: Prisma.RawMaterialPurchaseWhereInput = {
    businessId,
    ...(query.rawMaterialId ? { rawMaterialId: query.rawMaterialId } : {}),
    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
    ...(query.from || query.to
      ? {
          purchaseDate: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.rawMaterialPurchase.findMany({
      where,
      include: { rawMaterial: true, supplier: true },
      orderBy: { purchaseDate: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.rawMaterialPurchase.count({ where }),
  ]);

  return { items, total };
}

export async function createPurchase(businessId: string, input: CreatePurchaseInput) {
  await assertMaterialAndSupplierBelongToBusiness(businessId, input.rawMaterialId, input.supplierId);

  const totalPrice = computeTotalPrice(input.quantity, input.pricePerUnit);

  return prisma.rawMaterialPurchase.create({
    data: {
      businessId,
      rawMaterialId: input.rawMaterialId,
      supplierId: input.supplierId ?? null,
      purchaseDate: input.purchaseDate ?? new Date(),
      quantity: input.quantity,
      unit: input.unit,
      pricePerUnit: input.pricePerUnit,
      totalPrice,
      notes: input.notes ?? null,
    },
    include: { rawMaterial: true, supplier: true },
  });
}

export async function updatePurchase(businessId: string, id: string, input: UpdatePurchaseInput) {
  const purchase = await prisma.rawMaterialPurchase.findFirst({ where: { id, businessId } });
  if (!purchase) throw new NotFoundError("Purchase not found");

  if (input.rawMaterialId || input.supplierId !== undefined) {
    await assertMaterialAndSupplierBelongToBusiness(
      businessId,
      input.rawMaterialId ?? purchase.rawMaterialId,
      input.supplierId !== undefined ? input.supplierId : purchase.supplierId,
    );
  }

  const quantity = input.quantity ?? Number(purchase.quantity);
  const pricePerUnit = input.pricePerUnit ?? Number(purchase.pricePerUnit);
  const totalPrice = computeTotalPrice(quantity, pricePerUnit);

  return prisma.rawMaterialPurchase.update({
    where: { id },
    data: {
      rawMaterialId: input.rawMaterialId,
      supplierId: input.supplierId,
      purchaseDate: input.purchaseDate,
      quantity: input.quantity,
      unit: input.unit,
      pricePerUnit: input.pricePerUnit,
      totalPrice,
      notes: input.notes,
    },
    include: { rawMaterial: true, supplier: true },
  });
}

export async function deletePurchase(businessId: string, id: string) {
  const purchase = await prisma.rawMaterialPurchase.findFirst({ where: { id, businessId } });
  if (!purchase) throw new NotFoundError("Purchase not found");

  // Hard delete — this row is the record itself (nothing downstream
  // references it), and Total Investment is a live SUM query rather than a
  // cached running total, so removing a mis-logged entry needs no reconciliation.
  await prisma.rawMaterialPurchase.delete({ where: { id } });
}

export async function getPurchaseSummary(businessId: string, from?: Date, to?: Date) {
  const where: Prisma.RawMaterialPurchaseWhereInput = {
    businessId,
    ...(from || to
      ? {
          purchaseDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [totalAgg, byMaterial, dayRows] = await Promise.all([
    prisma.rawMaterialPurchase.aggregate({ where, _sum: { totalPrice: true }, _count: true }),
    prisma.rawMaterialPurchase.groupBy({
      by: ["rawMaterialId"],
      where,
      _sum: { totalPrice: true, quantity: true },
      orderBy: { _sum: { totalPrice: "desc" } },
    }),
    // Prisma's groupBy can't group by a truncated/expression column, and a
    // raw SQL DATE_TRUNC query is overkill at this business's scale — just
    // fetch the (date, price) pairs and bucket them by day in JS.
    prisma.rawMaterialPurchase.findMany({ where, select: { purchaseDate: true, totalPrice: true } }),
  ]);

  const materials = await prisma.rawMaterial.findMany({
    where: { id: { in: byMaterial.map((b) => b.rawMaterialId) } },
    select: { id: true, name: true, defaultUnit: true },
  });
  const materialMap = new Map(materials.map((m) => [m.id, m]));

  const byDayMap = new Map<string, { totalAmount: number; count: number }>();
  for (const row of dayRows) {
    const dayKey = row.purchaseDate.toISOString().slice(0, 10);
    const entry = byDayMap.get(dayKey) ?? { totalAmount: 0, count: 0 };
    entry.totalAmount += Number(row.totalPrice);
    entry.count += 1;
    byDayMap.set(dayKey, entry);
  }
  const byDay = Array.from(byDayMap.entries())
    .map(([date, v]) => ({ date, totalAmount: Math.round(v.totalAmount * 100) / 100, count: v.count }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 31);

  return {
    totalAmount: totalAgg._sum.totalPrice ?? 0,
    purchaseCount: totalAgg._count,
    byMaterial: byMaterial.map((b) => ({
      rawMaterialId: b.rawMaterialId,
      name: materialMap.get(b.rawMaterialId)?.name ?? "Unknown",
      unit: materialMap.get(b.rawMaterialId)?.defaultUnit ?? "",
      totalQuantity: b._sum.quantity ?? 0,
      totalAmount: b._sum.totalPrice ?? 0,
    })),
    byDay,
  };
}
