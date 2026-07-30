import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});
export type CreateBrandInput = z.infer<typeof createBrandSchema>;

export const updateBrandSchema = createBrandSchema.partial();
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
