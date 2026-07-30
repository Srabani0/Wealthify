import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdatePurchaseInput } from "@wealthify/shared";
import * as purchasesApi from "./api";
import type { PurchaseListParams, PurchaseSummaryParams } from "./api";
import { purchaseKeys } from "./queryKeys";

export function usePurchases(params: PurchaseListParams) {
  return useQuery({
    queryKey: purchaseKeys.list(params),
    queryFn: () => purchasesApi.listPurchases(params),
  });
}

export function usePurchaseSummary(params: PurchaseSummaryParams) {
  return useQuery({
    queryKey: purchaseKeys.summary(params),
    queryFn: () => purchasesApi.getPurchaseSummary(params),
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchasesApi.createPurchase,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseKeys.all() }),
  });
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePurchaseInput }) =>
      purchasesApi.updatePurchase(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseKeys.all() }),
  });
}

export function useDeletePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchasesApi.deletePurchase,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseKeys.all() }),
  });
}
