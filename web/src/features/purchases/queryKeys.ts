import type { PurchaseListParams, PurchaseSummaryParams } from "./api";

export const purchaseKeys = {
  all: () => ["purchases"] as const,
  list: (params: PurchaseListParams) => ["purchases", "list", params] as const,
  summary: (params: PurchaseSummaryParams) => ["purchases", "summary", params] as const,
};
