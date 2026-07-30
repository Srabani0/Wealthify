import type {
  ApiListSuccess,
  ApiSuccess,
  LowStockItem,
  StockAdjustmentInput,
  StockMovementSummary,
} from "@wealthify/shared";
import { api } from "@/lib/axios";

export interface StockMovementParams {
  variantId?: string;
  page: number;
  pageSize: number;
}

export async function adjustStock(input: StockAdjustmentInput) {
  const { data } = await api.post<ApiSuccess<{ movement: StockMovementSummary }>>(
    "/inventory/adjustments",
    input,
  );
  return data.data;
}

export async function listStockMovements(params: StockMovementParams) {
  const { data } = await api.get<ApiListSuccess<StockMovementSummary>>("/inventory/movements", {
    params,
  });
  return data;
}

export async function listLowStock() {
  const { data } = await api.get<ApiSuccess<LowStockItem[]>>("/inventory/low-stock");
  return data.data;
}
