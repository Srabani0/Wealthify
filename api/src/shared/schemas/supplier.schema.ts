import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  contactPerson: z.string().trim().max(150).optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  email: z.string().trim().toLowerCase().email().optional().nullable(),
});
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
