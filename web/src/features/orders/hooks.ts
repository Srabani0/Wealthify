import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateOrderInput } from "@wealthify/shared";
import * as ordersApi from "./api";
import type { OrderListParams, OrderSummaryParams } from "./api";
import { orderKeys } from "./queryKeys";
import { inventoryKeys } from "../inventory/queryKeys";
import { productKeys } from "../products/queryKeys";

// Creating/cancelling an order moves stock, so both inventory's low-stock
// panel and its movement history need invalidating alongside the order
// queries themselves — same pattern used by useAdjustStock.
function invalidateOrderAndStockQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: orderKeys.all() });
  queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() });
  queryClient.invalidateQueries({ queryKey: inventoryKeys.movementsAll() });
  queryClient.invalidateQueries({ queryKey: productKeys.all() });
}

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersApi.listOrders(params),
  });
}

export function useOrderSummary(params: OrderSummaryParams) {
  return useQuery({
    queryKey: orderKeys.summary(params),
    queryFn: () => ordersApi.getOrderSummary(params),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: () => invalidateOrderAndStockQueries(queryClient),
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOrderInput }) => ordersApi.updateOrder(id, input),
    onSuccess: () => invalidateOrderAndStockQueries(queryClient),
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    // Deleting an order that hasn't been cancelled yet also restores its
    // stock server-side, so this invalidates the same queries as
    // create/update rather than just the order list.
    mutationFn: ordersApi.deleteOrder,
    onSuccess: () => invalidateOrderAndStockQueries(queryClient),
  });
}
