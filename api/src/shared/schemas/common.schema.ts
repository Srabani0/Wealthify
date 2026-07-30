import { z } from "zod";

// Shared by every module's list endpoint (products, categories, brands, and
// later customers/orders/etc.) — keeps pagination/search query parsing
// identical everywhere instead of each module inventing its own shape.
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});
export type ListQueryInput = z.infer<typeof listQuerySchema>;
