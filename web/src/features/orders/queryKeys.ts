import type { OrderListParams, OrderSummaryParams } from "./api";

export const orderKeys = {
  all: () => ["orders"] as const,
  list: (params: OrderListParams) => ["orders", "list", params] as const,
  summary: (params: OrderSummaryParams) => ["orders", "summary", params] as const,
};
