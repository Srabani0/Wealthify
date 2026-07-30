import { z } from "zod";
import { MANUAL_ADJUSTMENT_TYPES } from "../constants/stock-movement.js";
import { listQuerySchema } from "./common.schema.js";

export const stockAdjustmentSchema = z.object({
  variantId: z.string().min(1),
  type: z.enum(MANUAL_ADJUSTMENT_TYPES),
  quantity: z.coerce.number().int().positive("Quantity must be a positive number"),
  reason: z.string().trim().max(500).optional().nullable(),
});
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

export const stockMovementQuerySchema = listQuerySchema.extend({
  variantId: z.string().min(1).optional(),
});
export type StockMovementQueryInput = z.infer<typeof stockMovementQuerySchema>;
