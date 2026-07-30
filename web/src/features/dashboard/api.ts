import type { ApiSuccess, DashboardSummary } from "@wealthify/shared";
import { api } from "@/lib/axios";

export interface DashboardSummaryParams {
  from?: Date;
  to?: Date;
}

export async function getDashboardSummary(params: DashboardSummaryParams) {
  const { data } = await api.get<ApiSuccess<DashboardSummary>>("/dashboard/summary", { params });
  return data.data;
}
