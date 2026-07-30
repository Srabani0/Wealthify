import { z } from "zod";

export const dashboardSummaryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type DashboardSummaryQueryInput = z.infer<typeof dashboardSummaryQuerySchema>;
