import { useQuery } from "@tanstack/react-query";
import * as dashboardApi from "./api";
import type { DashboardSummaryParams } from "./api";
import { dashboardKeys } from "./queryKeys";

export function useDashboardSummary(params: DashboardSummaryParams) {
  return useQuery({
    queryKey: dashboardKeys.summary(params),
    queryFn: () => dashboardApi.getDashboardSummary(params),
  });
}
