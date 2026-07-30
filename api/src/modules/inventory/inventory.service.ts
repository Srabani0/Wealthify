import type { StockAdjustmentInput } from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import { NotFoundError, ValidationError } from "../../lib/errors.js";

export async function adjustStock(businessId: string, userId: string, input: StockAdjustmentInput) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: input.variantId, product: { businessId } },
    include: { inventory: true },
  });
  if (!variant) throw new NotFoundError("Variant not found");

  const currentQty = variant.inventory?.quantityOnHand ?? 0;
  const delta = input.type === "ADJUSTMENT_IN" ? input.quantity : -input.quantity;
  const newQty = currentQty + delta;

  if (newQty < 0) {
    throw new ValidationError("This adjustment would leave stock at a negative quantity");
  }

  return prisma.$transaction(
    async (tx) => {
      const inventory = await tx.inventoryStock.upsert({
        where: { variantId: input.variantId },
        create: { variantId: input.variantId, quantityOnHand: newQty },
        update: { quantityOnHand: newQty },
      });

      const movement = await tx.stockMovement.create({
        data: {
          businessId,
          variantId: input.variantId,
          type: input.type,
          quantity: input.quantity,
          quantityAfter: newQty,
          reason: input.reason ?? null,
          referenceType: "MANUAL",
          createdById: userId,
        },
      });

      return { inventory, movement };
    },
    // Same generous timeout as product creation — guards against Neon
    // latency/cold-start variance expiring the default 5s window.
    { timeout: 15000 },
  );
}

export async function listStockMovements(
  businessId: string,
  variantId: string | undefined,
  page: number,
  pageSize: number,
) {
  const where = { businessId, ...(variantId ? { variantId } : {}) };

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { items, total };
}

// Filtered in JS rather than via a raw SQL column-to-column comparison —
// proportionate for this business's catalog size, and keeps the query
// portable without a $queryRaw escape hatch.
export async function listLowStock(businessId: string) {
  const variants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      product: { businessId, isActive: true },
    },
    include: { inventory: true, product: { select: { id: true, name: true } } },
  });

  return variants
    .filter((v) => (v.inventory?.quantityOnHand ?? 0) <= v.lowStockThreshold)
    .map((v) => ({
      variantId: v.id,
      productId: v.product.id,
      productName: v.product.name,
      variantName: v.variantName,
      sku: v.sku,
      quantityOnHand: v.inventory?.quantityOnHand ?? 0,
      lowStockThreshold: v.lowStockThreshold,
    }))
    .sort((a, b) => a.quantityOnHand - b.quantityOnHand);
}
