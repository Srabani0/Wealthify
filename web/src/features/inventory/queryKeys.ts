import type { StockMovementParams } from "./api";

export const inventoryKeys = {
  lowStock: () => ["inventory", "low-stock"] as const,
  movements: (params: StockMovementParams) => ["inventory", "movements", params] as const,
  movementsAll: () => ["inventory", "movements"] as const,
};
