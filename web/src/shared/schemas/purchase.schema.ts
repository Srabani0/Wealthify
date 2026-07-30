import { z } from "zod";
import { listQuerySchema } from "./common.schema.js";

export const createPurchaseSchema = z.object({
  rawMaterialId: z.string().min(1, "Select a raw material"),
  supplierId: z.string().min(1).optional().nullable(),
  purchaseDate: z.coerce.date().optional(),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.string().trim().min(1).max(30),
  pricePerUnit: z.coerce.number().min(0, "Price can't be negative"),
  notes: z.string().trim().max(500).optional().nullable(),
});
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export const updatePurchaseSchema = createPurchaseSchema.partial();
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;

export const purchaseListQuerySchema = listQuerySchema.extend({
  rawMaterialId: z.string().min(1).optional(),
  supplierId: z.string().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type PurchaseListQueryInput = z.infer<typeof purchaseListQuerySchema>;

export const purchaseSummaryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type PurchaseSummaryQueryInput = z.infer<typeof purchaseSummaryQuerySchema>;
