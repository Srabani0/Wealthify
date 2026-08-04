import { Prisma } from "@prisma/client";
import { formatBillNumber, type CreateOrderInput, type OrderListQueryInput, type UpdateOrderInput } from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import { NotFoundError, ValidationError } from "../../lib/errors.js";
import { generateBillPdf } from "../../lib/pdf/BillDocument.js";

const orderInclude = {
  customer: true,
  items: {
    include: {
      variant: {
        include: { product: { select: { id: true, name: true } } },
      },
    },
  },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

// Flattened so the frontend can render `item.productName`/`item.sku`
// directly instead of reaching through `item.variant.product.name`.
function shapeOrder(order: OrderWithRelations) {
  return {
    ...order,
    items: order.items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      productName: item.variant.product.name,
      variantName: item.variant.variantName,
      sku: item.variant.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      lineTotal: item.lineTotal,
      lineProfit: item.lineProfit,
    })),
  };
}

function findOrderWithRelations(client: Prisma.TransactionClient | typeof prisma, orderId: string) {
  return client.order.findUnique({ where: { id: orderId }, include: orderInclude });
}

interface VariantForOrderItem {
  costPrice: Prisma.Decimal;
  variantName: string;
  inventory: { quantityOnHand: number } | null;
  product: { name: string };
}

interface OrderItemPlan {
  variantId: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  lineTotal: number;
  lineProfit: number;
}

// Multiple lines can reference the same variant — check combined demand
// against stock on hand before touching anything.
function assertSufficientStock(
  items: { variantId: string; quantity: number }[],
  variantMap: Map<string, VariantForOrderItem>,
) {
  const requested = new Map<string, number>();
  for (const item of items) {
    requested.set(item.variantId, (requested.get(item.variantId) ?? 0) + item.quantity);
  }
  for (const [variantId, qty] of requested) {
    const variant = variantMap.get(variantId);
    if (!variant) throw new ValidationError("One of the selected products could not be found");
    const available = variant.inventory?.quantityOnHand ?? 0;
    if (qty > available) {
      throw new ValidationError(
        `Not enough stock for ${variant.product.name} (${variant.variantName}) — only ${available} available`,
      );
    }
  }
}

function computeItemPlans(
  items: { variantId: string; quantity: number; unitPrice: number }[],
  variantMap: Map<string, VariantForOrderItem>,
): { plans: OrderItemPlan[]; totalAmount: number; totalProfit: number } {
  let totalAmount = 0;
  let totalProfit = 0;
  const plans = items.map((item) => {
    const variant = variantMap.get(item.variantId);
    if (!variant) throw new ValidationError("One of the selected products could not be found");

    const costPrice = Number(variant.costPrice);
    const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
    const lineProfit = Math.round(item.quantity * (item.unitPrice - costPrice) * 100) / 100;
    totalAmount += lineTotal;
    totalProfit += lineProfit;

    return {
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice,
      lineTotal,
      lineProfit,
    };
  });

  return {
    plans,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
  };
}

// Writes OrderItem rows + decrements stock + logs SALE_OUT movements for a
// validated set of item plans. `runningQty` is mutated as it goes so
// repeated lines for the same variant decrement cumulatively and correctly.
async function writeOrderItems(
  tx: Prisma.TransactionClient,
  businessId: string,
  userId: string,
  orderId: string,
  plans: OrderItemPlan[],
  runningQty: Map<string, number>,
  reason: string,
  referenceType: string,
) {
  for (const plan of plans) {
    await tx.orderItem.create({
      data: {
        orderId,
        variantId: plan.variantId,
        quantity: plan.quantity,
        unitPrice: plan.unitPrice,
        costPrice: plan.costPrice,
        lineTotal: plan.lineTotal,
        lineProfit: plan.lineProfit,
      },
    });

    const currentQty = runningQty.get(plan.variantId) ?? 0;
    const newQtyAfter = currentQty - plan.quantity;
    runningQty.set(plan.variantId, newQtyAfter);

    await tx.inventoryStock.upsert({
      where: { variantId: plan.variantId },
      create: { variantId: plan.variantId, quantityOnHand: newQtyAfter },
      update: { quantityOnHand: newQtyAfter },
    });

    await tx.stockMovement.create({
      data: {
        businessId,
        variantId: plan.variantId,
        type: "SALE_OUT",
        quantity: plan.quantity,
        quantityAfter: newQtyAfter,
        reason,
        referenceType,
        referenceId: orderId,
        createdById: userId,
      },
    });
  }
}

// Restores stock for a set of items (cancelling, or reversing before an
// edit re-applies a possibly-different item list) and logs RETURN_IN
// movements for the audit trail.
async function reverseOrderItems(
  tx: Prisma.TransactionClient,
  businessId: string,
  userId: string,
  orderId: string,
  items: { variantId: string; quantity: number }[],
  reason: string,
  referenceType: string,
) {
  for (const item of items) {
    const inventory = await tx.inventoryStock.findUnique({ where: { variantId: item.variantId } });
    const newQty = (inventory?.quantityOnHand ?? 0) + item.quantity;

    await tx.inventoryStock.upsert({
      where: { variantId: item.variantId },
      create: { variantId: item.variantId, quantityOnHand: newQty },
      update: { quantityOnHand: newQty },
    });

    await tx.stockMovement.create({
      data: {
        businessId,
        variantId: item.variantId,
        type: "RETURN_IN",
        quantity: item.quantity,
        quantityAfter: newQty,
        reason,
        referenceType,
        referenceId: orderId,
        createdById: userId,
      },
    });
  }
}

export async function listOrders(businessId: string, query: OrderListQueryInput) {
  const where: Prisma.OrderWhereInput = {
    businessId,
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.channel ? { channel: query.channel } : {}),
    ...(query.from || query.to
      ? {
          orderDate: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { orderDate: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { items: items.map(shapeOrder), total };
}

export async function createOrder(businessId: string, userId: string, input: CreateOrderInput) {
  if (input.customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: input.customerId, businessId } });
    if (!customer) throw new ValidationError("Customer not found");
  }

  const variantIds = [...new Set(input.items.map((i) => i.variantId))];
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds }, product: { businessId } },
    include: { inventory: true, product: { select: { name: true } } },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  assertSufficientStock(input.items, variantMap);
  const { plans, totalAmount, totalProfit } = computeItemPlans(input.items, variantMap);
  const runningQty = new Map<string, number>(variants.map((v) => [v.id, v.inventory?.quantityOnHand ?? 0]));

  const created = await prisma.$transaction(
    async (tx) => {
      // Atomic per-business counter — the upsert's row-level lock inside
      // this transaction is what keeps concurrent order creations from
      // ever handing out the same bill number.
      const sequence = await tx.billSequence.upsert({
        where: { businessId },
        create: { businessId, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });

      const order = await tx.order.create({
        data: {
          businessId,
          customerId: input.customerId ?? null,
          orderDate: input.orderDate ?? new Date(),
          channel: input.channel,
          status: input.status,
          paymentStatus: input.paymentStatus,
          billNumber: sequence.lastNumber,
          notes: input.notes ?? null,
          totalAmount,
          totalProfit,
        },
      });

      await writeOrderItems(tx, businessId, userId, order.id, plans, runningQty, "Order sale", "ORDER");

      return order;
    },
    // Same generous timeout as product creation/inventory adjustment —
    // guards against Neon latency variance on this multi-step transaction.
    { timeout: 15000 },
  );

  const fresh = await findOrderWithRelations(prisma, created.id);
  return fresh ? shapeOrder(fresh) : null;
}

export async function updateOrder(
  businessId: string,
  userId: string,
  orderId: string,
  input: UpdateOrderInput,
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, businessId },
    include: { items: true },
  });
  if (!order) throw new NotFoundError("Order not found");

  // Presence of any content field (not just status/paymentStatus) means
  // this is a full edit from the Edit dialog, not the lightweight
  // status-dropdown/payment-toggle/cancel calls the table also uses.
  const isContentEdit =
    input.items !== undefined ||
    input.customerId !== undefined ||
    input.orderDate !== undefined ||
    input.channel !== undefined ||
    input.notes !== undefined;

  if (order.status === "CANCELLED") {
    if (isContentEdit) throw new ValidationError("A cancelled order can't be edited");
    if (input.status && input.status !== "CANCELLED") {
      throw new ValidationError("A cancelled order can't be reopened");
    }
  }

  if (isContentEdit) {
    if (input.customerId) {
      const customer = await prisma.customer.findFirst({ where: { id: input.customerId, businessId } });
      if (!customer) throw new ValidationError("Customer not found");
    }

    const newItemsInput =
      input.items ??
      order.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      }));

    await prisma.$transaction(
      async (tx) => {
        // Reverse the stock this order originally decremented, then
        // re-validate/re-apply against the now-restored on-hand
        // quantities — this is what keeps an edit correct no matter how
        // the item list changed (lines added, removed, or resized).
        await reverseOrderItems(
          tx,
          businessId,
          userId,
          order.id,
          order.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
          "Order edited",
          "ORDER_EDITED",
        );

        await tx.orderItem.deleteMany({ where: { orderId: order.id } });

        const variantIds = [...new Set(newItemsInput.map((i) => i.variantId))];
        const variants = await tx.productVariant.findMany({
          where: { id: { in: variantIds }, product: { businessId } },
          include: { inventory: true, product: { select: { name: true } } },
        });
        const variantMap = new Map(variants.map((v) => [v.id, v]));

        assertSufficientStock(newItemsInput, variantMap);
        const { plans, totalAmount, totalProfit } = computeItemPlans(newItemsInput, variantMap);
        const runningQty = new Map<string, number>(
          variants.map((v) => [v.id, v.inventory?.quantityOnHand ?? 0]),
        );

        await writeOrderItems(
          tx,
          businessId,
          userId,
          order.id,
          plans,
          runningQty,
          "Order edited",
          "ORDER_EDITED",
        );

        await tx.order.update({
          where: { id: orderId },
          data: {
            customerId: input.customerId !== undefined ? input.customerId : order.customerId,
            orderDate: input.orderDate ?? order.orderDate,
            channel: input.channel ?? order.channel,
            notes: input.notes !== undefined ? input.notes : order.notes,
            status: input.status ?? order.status,
            paymentStatus: input.paymentStatus ?? order.paymentStatus,
            totalAmount,
            totalProfit,
          },
        });
      },
      { timeout: 15000 },
    );

    const fresh = await findOrderWithRelations(prisma, orderId);
    return fresh ? shapeOrder(fresh) : null;
  }

  // Lightweight path: status and/or paymentStatus only — what the inline
  // table controls (status dropdown, payment toggle, cancel) call.
  // READY/DELIVERED/COMPLETED are just fulfillment labels with no stock
  // effect (stock already moved at creation); CANCELLED is the only
  // transition that moves stock, and it's one-way (enforced above).
  const nextStatus = input.status ?? order.status;
  const isCancelling = nextStatus === "CANCELLED" && order.status !== "CANCELLED";

  if (isCancelling) {
    await prisma.$transaction(
      async (tx) => {
        await reverseOrderItems(
          tx,
          businessId,
          userId,
          order.id,
          order.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
          "Order cancelled",
          "ORDER_CANCELLED",
        );

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "CANCELLED",
            ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
          },
        });
      },
      { timeout: 15000 },
    );
  } else {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
      },
    });
  }

  const fresh = await findOrderWithRelations(prisma, orderId);
  return fresh ? shapeOrder(fresh) : null;
}

export async function deleteOrder(businessId: string, userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, businessId },
    include: { items: true },
  });
  if (!order) throw new NotFoundError("Order not found");

  await prisma.$transaction(
    async (tx) => {
      // A cancelled order already had its stock restored (see updateOrder's
      // cancel path) — only reverse it here if that hasn't happened yet, so
      // deleting an active order can't leave stock permanently short.
      if (order.status !== "CANCELLED") {
        await reverseOrderItems(
          tx,
          businessId,
          userId,
          order.id,
          order.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
          "Order deleted",
          "ORDER_DELETED",
        );
      }

      // OrderItem rows cascade-delete with the order (see schema.prisma).
      await tx.order.delete({ where: { id: orderId } });
    },
    { timeout: 15000 },
  );
}

export async function getOrderSummary(businessId: string, from?: Date, to?: Date) {
  const where: Prisma.OrderWhereInput = {
    businessId,
    // Stock already moved at creation regardless of fulfillment stage, so
    // Ready/Delivered/Completed orders all count as real revenue here —
    // only Cancelled (which reversed that stock movement) is excluded.
    status: { not: "CANCELLED" },
    ...(from || to
      ? {
          orderDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [totalAgg, byProduct, dayRows] = await Promise.all([
    prisma.order.aggregate({ where, _sum: { totalAmount: true, totalProfit: true }, _count: true }),
    prisma.orderItem.groupBy({
      by: ["variantId"],
      where: { order: where },
      _sum: { quantity: true, lineTotal: true, lineProfit: true },
      orderBy: { _sum: { lineTotal: "desc" } },
    }),
    // Prisma's groupBy can't group by a truncated/expression column — bucket
    // by day in JS, same approach as the purchases summary.
    prisma.order.findMany({ where, select: { orderDate: true, totalAmount: true, totalProfit: true } }),
  ]);

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: byProduct.map((b) => b.variantId) } },
    select: { id: true, variantName: true, product: { select: { name: true } } },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  const byDayMap = new Map<string, { totalAmount: number; totalProfit: number; count: number }>();
  for (const row of dayRows) {
    const dayKey = row.orderDate.toISOString().slice(0, 10);
    const entry = byDayMap.get(dayKey) ?? { totalAmount: 0, totalProfit: 0, count: 0 };
    entry.totalAmount += Number(row.totalAmount);
    entry.totalProfit += Number(row.totalProfit);
    entry.count += 1;
    byDayMap.set(dayKey, entry);
  }
  const byDay = Array.from(byDayMap.entries())
    .map(([date, v]) => ({
      date,
      totalAmount: Math.round(v.totalAmount * 100) / 100,
      totalProfit: Math.round(v.totalProfit * 100) / 100,
      count: v.count,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 31);

  return {
    totalAmount: totalAgg._sum.totalAmount ?? 0,
    totalProfit: totalAgg._sum.totalProfit ?? 0,
    orderCount: totalAgg._count,
    byProduct: byProduct.map((b) => ({
      variantId: b.variantId,
      productName: variantMap.get(b.variantId)?.product.name ?? "Unknown",
      variantName: variantMap.get(b.variantId)?.variantName ?? "",
      totalQuantity: b._sum.quantity ?? 0,
      totalAmount: b._sum.lineTotal ?? 0,
      totalProfit: b._sum.lineProfit ?? 0,
    })),
    byDay,
  };
}

export async function getOrderBillPdf(
  businessId: string,
  orderId: string,
): Promise<{ buffer: Buffer; billNumber: number | null }> {
  const order = await findOrderWithRelations(prisma, orderId);
  if (!order || order.businessId !== businessId) {
    throw new NotFoundError("Order not found");
  }

  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });

  const addressLines = [
    business.address,
    [business.city, business.state, business.pincode].filter(Boolean).join(", "),
  ].filter((line): line is string => !!line);

  const buffer = await generateBillPdf({
    businessName: business.name,
    businessAddressLines: addressLines,
    businessPhone: business.phone,
    businessEmail: business.email,
    logoUrl: business.logoUrl,
    billNumber: formatBillNumber(order.billNumber),
    orderDate: order.orderDate,
    customerName: order.customer?.name ?? null,
    customerPhone: order.customer?.phone ?? null,
    status: order.status,
    paymentStatus: order.paymentStatus,
    items: order.items.map((item) => ({
      productName: item.variant.product.name,
      variantName: item.variant.variantName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
    totalAmount: Number(order.totalAmount),
    notes: order.notes,
  });

  return { buffer, billNumber: order.billNumber };
}
