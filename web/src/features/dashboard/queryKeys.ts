import type { DashboardSummaryParams } from "./api";

export const dashboardKeys = {
  summary: (params: DashboardSummaryParams) => ["dashboard", "summary", params] as const,
};
