import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as inventoryApi from "./api";
import type { StockMovementParams } from "./api";
import { inventoryKeys } from "./queryKeys";
import { productKeys } from "../products/queryKeys";

export function useLowStock() {
  return useQuery({ queryKey: inventoryKeys.lowStock(), queryFn: inventoryApi.listLowStock });
}

export function useStockMovements(params: StockMovementParams) {
  return useQuery({
    queryKey: inventoryKeys.movements(params),
    queryFn: () => inventoryApi.listStockMovements(params),
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.movementsAll() });
      queryClient.invalidateQueries({ queryKey: productKeys.all() });
    },
  });
}
