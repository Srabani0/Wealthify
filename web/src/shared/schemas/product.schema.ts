import { z } from "zod";
import { DEFAULT_UNIT } from "../constants/units.js";
import { listQuerySchema } from "./common.schema.js";

// Shared by product create (inline) and the standalone add-variant endpoint.
// `sku`/`barcode` are optional — omitted means "auto-generate" server-side.
export const productVariantInputSchema = z.object({
  variantName: z.string().trim().min(1).max(100).default("Default"),
  attributes: z.record(z.string(), z.string()).optional().nullable(),
  sku: z.string().trim().max(50).optional(),
  barcode: z.string().trim().max(50).optional().nullable(),
  costPrice: z.coerce.number().min(0, "Cost price can't be negative"),
  sellingPrice: z.coerce.number().min(0, "Selling price can't be negative"),
  mrp: z.coerce.number().min(0).optional().nullable(),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
});
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  categoryId: z.string().min(1).optional().nullable(),
  brandId: z.string().min(1).optional().nullable(),
  hsnCode: z.string().trim().max(20).optional().nullable(),
  gstRate: z.coerce.number().min(0).max(100).optional(),
  unit: z.string().trim().min(1).max(30).default(DEFAULT_UNIT),
  hasVariants: z.boolean().default(false),
  variants: z.array(productVariantInputSchema).min(1, "At least one variant is required"),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  categoryId: z.string().min(1).optional().nullable(),
  brandId: z.string().min(1).optional().nullable(),
  hsnCode: z.string().trim().max(20).optional().nullable(),
  gstRate: z.coerce.number().min(0).max(100).optional(),
  unit: z.string().trim().min(1).max(30).optional(),
  hasVariants: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const addProductVariantSchema = productVariantInputSchema;
export type AddProductVariantInput = z.infer<typeof addProductVariantSchema>;

export const updateProductVariantSchema = productVariantInputSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>;

export const addProductImageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
});
export type AddProductImageInput = z.infer<typeof addProductImageSchema>;

export const productListQuerySchema = listQuerySchema.extend({
  categoryId: z.string().min(1).optional(),
  brandId: z.string().min(1).optional(),
});
export type ProductListQueryInput = z.infer<typeof productListQuerySchema>;
