import { z } from "zod";
import { DEFAULT_UNIT } from "../constants/units.js";

export const createRawMaterialSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  defaultUnit: z.string().trim().min(1).max(30).default(DEFAULT_UNIT),
});
export type CreateRawMaterialInput = z.infer<typeof createRawMaterialSchema>;

export const updateRawMaterialSchema = createRawMaterialSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateRawMaterialInput = z.infer<typeof updateRawMaterialSchema>;
