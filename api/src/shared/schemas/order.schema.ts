import { z } from "zod";
import { ORDER_CHANNELS, ORDER_PAYMENT_STATUSES, ORDER_STATUSES } from "../constants/order.js";
import { listQuerySchema } from "./common.schema.js";

export const orderItemInputSchema = z.object({
  variantId: z.string().min(1, "Select a product"),
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Price can't be negative"),
});
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

export const createOrderSchema = z.object({
  customerId: z.string().min(1).optional().nullable(),
  orderDate: z.coerce.date().optional(),
  channel: z.enum(ORDER_CHANNELS).default("OFFLINE"),
  // CANCELLED isn't a valid starting point — an order can only be cancelled
  // after it exists (see updateOrderSchema), never created that way.
  status: z.enum(ORDER_STATUSES).exclude(["CANCELLED"]).default("COMPLETED"),
  paymentStatus: z.enum(ORDER_PAYMENT_STATUSES).default("UNPAID"),
  notes: z.string().trim().max(500).optional().nullable(),
  items: z.array(orderItemInputSchema).min(1, "Add at least one item"),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object({
  // Presence of `items` is what tells the backend this is a full content
  // edit (recomputing totals and reconciling stock) rather than the
  // lightweight status/paymentStatus-only patch used by the inline table
  // controls.
  customerId: z.string().min(1).optional().nullable(),
  orderDate: z.coerce.date().optional(),
  channel: z.enum(ORDER_CHANNELS).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
  items: z.array(orderItemInputSchema).min(1, "Add at least one item").optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(ORDER_PAYMENT_STATUSES).optional(),
});
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export const orderListQuerySchema = listQuerySchema.extend({
  customerId: z.string().min(1).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  channel: z.enum(ORDER_CHANNELS).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type OrderListQueryInput = z.infer<typeof orderListQuerySchema>;

export const orderSummaryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type OrderSummaryQueryInput = z.infer<typeof orderSummaryQuerySchema>;
